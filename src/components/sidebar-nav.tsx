"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  GraduationCap,
  History,
  Home,
  LogOut,
  MessageSquareHeart,
  NotebookPen,
  Settings,
  Sprout,
  Users,
} from "lucide-react";
import { logout } from "@/app/actions";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (pathname: string) => boolean;
}[] = [
  { href: "/", label: "대시보드", icon: Home, isActive: (p) => p === "/" },
  { href: "/mentees", label: "멘티", icon: Users, isActive: (p) => p.startsWith("/mentees") },
  { href: "/mentees", label: "일지", icon: NotebookPen, isActive: () => false },
  { href: "/history", label: "기록", icon: History, isActive: (p) => p.startsWith("/history") },
  { href: "/classes", label: "수업", icon: GraduationCap, isActive: (p) => p.startsWith("/classes") },
  { href: "/events", label: "행사", icon: CalendarDays, isActive: (p) => p.startsWith("/events") },
  { href: "/today", label: "오늘", icon: CalendarDays, isActive: (p) => p.startsWith("/today") },
];

const ADMIN_NAV_ITEM = {
  href: "/feedback",
  label: "피드백함",
  icon: MessageSquareHeart,
  isActive: (pathname: string) => pathname.startsWith("/feedback"),
};

export function SidebarNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const navItems = isAdmin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-stone-200 bg-white lg:flex">
      <Link href="/" className="flex items-center gap-2.5 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Sprout className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-heading text-lg font-extrabold tracking-tight text-stone-900">
            새싹일기
          </span>
          <span className="text-xs text-stone-500">지역아동센터</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {navItems.map(({ href, label, icon: Icon, isActive }, index) => {
          const active = isActive(pathname);
          return (
            <Link
              key={`${href}-${label}-${index}`}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-stone-200 px-3 py-4">
        <Link
          href="/mentees"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-emerald-700"
        >
          <NotebookPen className="h-4 w-4" aria-hidden /> 새 일지 작성
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        >
          <Settings className="h-5 w-5" aria-hidden />
          설정
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
