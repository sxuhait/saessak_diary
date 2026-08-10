"use client";

import { useEffect, useState } from "react";
import { FeedbackModal } from "@/components/feedback-modal";

const STORAGE_KEY = "saessak:feedback-prompt-last-shown";
// Opportunistic nudge after saving a log, but only occasionally -- a modal
// on every single save would get old fast. Two weeks between prompts, win
// or lose (dismissing still resets the cooldown, same as submitting).
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 1200;

// `trigger` is `saved === "1"` from the page's own searchParams -- true
// every time this page renders right after a session log save.
export function PostSaveFeedbackPrompt({ trigger }: { trigger: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    let lastShown = 0;
    try {
      lastShown = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    } catch {
      return; // localStorage unavailable -- skip the opportunistic prompt
    }

    if (Date.now() - lastShown < COOLDOWN_MS) return;

    const timer = setTimeout(() => {
      setOpen(true);
      try {
        window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore -- worst case it can prompt again sooner than intended
      }
    }, OPEN_DELAY_MS);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <FeedbackModal
      open={open}
      onClose={() => setOpen(false)}
      title="써보니 어떠셨어요?"
      description="일지 작성 잘 하셨나요? 짧은 의견도 큰 도움이 됩니다."
    />
  );
}
