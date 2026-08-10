import Link from "next/link";
import type { ReactNode } from "react";
import { Sprout } from "lucide-react";

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <div className="flex flex-col justify-between gap-8 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white px-8 py-10 lg:w-[38%] lg:px-12 lg:py-14">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Sprout className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-xl font-extrabold tracking-tight text-stone-900">
              새싹일기
            </span>
            <span className="text-xs text-stone-500">지역아동센터</span>
          </span>
        </Link>

        <div className="hidden flex-1 flex-col items-center justify-center lg:flex">
          <span className="flex h-40 w-40 items-center justify-center rounded-full bg-white/70 shadow-soft">
            <Sprout className="h-20 w-20 text-emerald-400" strokeWidth={1.5} aria-hidden />
          </span>
        </div>

        <p className="text-sm text-stone-500 italic">
          &ldquo;아이들의 성장을 함께 지켜보는 멘토링, 새싹일기와 함께하세요.&rdquo;
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        {children}
      </div>
    </div>
  );
}
