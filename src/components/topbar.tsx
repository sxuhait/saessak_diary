"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleUserRound, MessageSquareHeart } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { FeedbackModal } from "@/components/feedback-modal";
import { SearchBar } from "@/components/search-bar";
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
      <div className="flex-1">
        <SearchBar />
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
