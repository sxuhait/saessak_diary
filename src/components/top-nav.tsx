"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CircleUserRound, MessageSquareHeart, Sprout } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { FeedbackModal } from "@/components/feedback-modal";
import type { AppNotification } from "@/lib/notifications";

const BASE_NAV_ITEMS: {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}[] = [
  { href: "/", label: "홈", isActive: (pathname) => pathname === "/" },
  {
    href: "/mentees",
    label: "멘티",
    isActive: (pathname) => pathname.startsWith("/mentees"),
  },
  {
    href: "/classes",
    label: "수업",
    isActive: (pathname) => pathname.startsWith("/classes"),
  },
  {
    href: "/events",
    label: "행사",
    isActive: (pathname) => pathname.startsWith("/events"),
  },
  {
    href: "/today",
    label: "오늘",
    isActive: (pathname) => pathname.startsWith("/today"),
  },
  {
    href: "/profile",
    label: "내 정보",
    isActive: (pathname) => pathname.startsWith("/profile"),
  },
];

const ADMIN_NAV_ITEM = {
  href: "/feedback",
  label: "피드백함",
  isActive: (pathname: string) => pathname.startsWith("/feedback"),
};

export function TopNav({
  profileInitial,
  notifications = [],
  isAdmin = false,
}: {
  profileInitial?: string;
  notifications?: AppNotification[];
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const navItems = isAdmin ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-emerald-700"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Sprout className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">새싹일기</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {navItems.map(({ href, label, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            aria-label="피드백 남기기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            <MessageSquareHeart className="h-5 w-5" aria-hidden />
          </button>
          <NotificationBell notifications={notifications} />
          <Link
            href="/profile"
            aria-label="내 정보"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
          >
            {profileInitial ?? <CircleUserRound className="h-5 w-5" aria-hidden />}
          </Link>
        </div>
      </div>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </header>
  );
}
