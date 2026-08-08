"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CalendarDays, Clock } from "lucide-react";
import type { AppNotification, NotificationCategory } from "@/lib/notifications";

const SEEN_IDS_STORAGE_KEY = "saessak:seen-notification-ids";
const EMPTY_SEEN_IDS = new Set<string>();

// Module-level store synced with localStorage -- read via useSyncExternalStore
// so the read+setState doesn't happen inside a useEffect body (which the
// react-hooks lint rule flags) and so SSR/hydration agree on the initial
// snapshot (server always sees "nothing seen yet").
let seenIdsCache: Set<string> | null = null;
const listeners = new Set<() => void>();

function readSeenIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_IDS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function getSeenIdsSnapshot(): Set<string> {
  if (!seenIdsCache) {
    seenIdsCache = readSeenIds();
  }
  return seenIdsCache;
}

function getServerSeenIdsSnapshot(): Set<string> {
  return EMPTY_SEEN_IDS;
}

function subscribeSeenIds(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function markSeen(ids: string[]) {
  const next = new Set(getSeenIdsSnapshot());
  for (const id of ids) next.add(id);
  seenIdsCache = next;
  try {
    window.localStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // localStorage unavailable (private mode etc.) -- badge just won't persist.
  }
  listeners.forEach((listener) => listener());
}

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  diagnostics: AlertTriangle,
  event: CalendarDays,
  volunteer_expiry: Clock,
};

export function NotificationBell({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const seenIds = useSyncExternalStore(
    subscribeSeenIds,
    getSeenIdsSnapshot,
    getServerSeenIdsSnapshot,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter(
    (notification) => !seenIds.has(notification.id),
  ).length;

  function handleToggle() {
    const next = !open;
    if (next) {
      markSeen(notifications.map((notification) => notification.id));
    }
    setOpen(next);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `알림 (안 읽음 ${unreadCount}개)` : "알림"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-11 right-0 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1.5 text-sm font-semibold text-stone-900">알림</p>

          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-stone-500">
              새로운 알림이 없습니다
            </p>
          ) : (
            <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = CATEGORY_ICON[notification.category];
                return (
                  <li key={notification.id}>
                    <Link
                      href={notification.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-emerald-50"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-stone-900">
                          {notification.title}
                        </span>
                        <span className="text-xs text-stone-500">
                          {notification.description}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
