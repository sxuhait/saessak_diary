"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  GraduationCap,
  CalendarDays,
  CircleUserRound,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/",
    label: "홈",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/mentees",
    label: "멘티",
    icon: Users,
    isActive: (pathname) => pathname.startsWith("/mentees"),
  },
  {
    href: "/classes",
    label: "수업",
    icon: GraduationCap,
    isActive: (pathname) => pathname.startsWith("/classes"),
  },
  {
    href: "/events",
    label: "행사",
    icon: CalendarDays,
    isActive: (pathname) => pathname.startsWith("/events"),
  },
  {
    href: "/profile",
    label: "내 정보",
    icon: CircleUserRound,
    isActive: (pathname) => pathname.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-2xl">
        {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                active ? "text-emerald-700" : "text-stone-500"
              }`}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
              />
              <span className={active ? "font-medium" : undefined}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
