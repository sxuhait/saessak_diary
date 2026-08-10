"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleUserRound, MessageSquareHeart, Search } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { FeedbackModal } from "@/components/feedback-modal";
import type { AppNotification } from "@/lib/notifications";

export function Topbar({
  profileInitial,
  notifications = [],
}: {
  profileInitial?: string;
  notifications?: AppNotification[];
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:gap-4 sm:px-6">
      <div className="relative flex-1 max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          type="search"
          placeholder="일지, 멘티 검색..."
          disabled
          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-sm text-stone-500 placeholder:text-stone-400"
        />
      </div>

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

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </header>
  );
}
