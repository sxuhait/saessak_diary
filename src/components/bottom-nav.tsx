"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleUserRound,
  Clock,
  GraduationCap,
  History,
  Home,
  MessageSquareHeart,
  MoreHorizontal,
  NotebookPen,
  Users,
} from "lucide-react";

const ITEMS: {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
}[] = [
  { href: "/", label: "대시보드", icon: Home, isActive: (p) => p === "/" },
  { href: "/mentees", label: "멘티", icon: Users, isActive: (p) => p.startsWith("/mentees") },
  { href: "/logs", label: "일지", icon: NotebookPen, isActive: (p) => p.startsWith("/logs") },
  { href: "/history", label: "기록", icon: History, isActive: (p) => p.startsWith("/history") },
  { href: "/profile", label: "내 정보", icon: CircleUserRound, isActive: (p) => p.startsWith("/profile") },
];

const MORE_ITEMS: {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
}[] = [
  { href: "/classes", label: "수업", icon: GraduationCap, isActive: (p) => p.startsWith("/classes") },
  { href: "/events", label: "행사", icon: CalendarDays, isActive: (p) => p.startsWith("/events") },
  { href: "/today", label: "오늘", icon: Clock, isActive: (p) => p.startsWith("/today") },
];

const ADMIN_MORE_ITEM = {
  href: "/feedback",
  label: "피드백함",
  icon: MessageSquareHeart,
  isActive: (pathname: string) => pathname.startsWith("/feedback"),
};

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const moreItems = isAdmin ? [...MORE_ITEMS, ADMIN_MORE_ITEM] : MORE_ITEMS;
  const moreActive = moreItems.some((item) => item.isActive(pathname));

  useEffect(() => {
    if (!moreOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-stone-200 bg-white px-2 py-2 lg:hidden">
      {ITEMS.map(({ href, label, icon: Icon, isActive }, index) => {
        const active = isActive(pathname);
        return (
          <Link
            key={`${href}-${label}-${index}`}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium text-stone-500"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                active ? "bg-emerald-100 text-emerald-700" : "text-stone-500"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className={active ? "text-emerald-700" : "text-stone-500"}>{label}</span>
          </Link>
        );
      })}

      <div className="relative flex flex-col items-center" ref={moreRef}>
        {moreOpen && (
          <div className="absolute bottom-14 right-0 z-50 w-44 rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
            <ul className="flex flex-col gap-1">
              {moreItems.map(({ href, label, icon: Icon, isActive }) => {
                const active = isActive(pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
                        active
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-label="더보기"
          aria-expanded={moreOpen}
          className="flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium text-stone-500"
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              moreActive || moreOpen ? "bg-emerald-100 text-emerald-700" : "text-stone-500"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
          </span>
          <span className={moreActive || moreOpen ? "text-emerald-700" : "text-stone-500"}>
            더보기
          </span>
        </button>
      </div>
    </nav>
  );
}
