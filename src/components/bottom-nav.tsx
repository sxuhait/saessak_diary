"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, History, Home, NotebookPen, Users } from "lucide-react";

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

export function BottomNav() {
  const pathname = usePathname();

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
    </nav>
  );
}
