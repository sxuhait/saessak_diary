"use client";

import { useState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/form";
import { checkInToday, checkOutToday } from "./actions";

export function VolunteerCheckin({ checkedIn }: { checkedIn: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setPending(true);
    setError(null);
    const result = checkedIn ? await checkOutToday() : await checkInToday();
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={checkedIn ? secondaryButtonClass : primaryButtonClass}
      >
        {pending ? "처리 중..." : checkedIn ? "참석 취소" : "오늘 참석합니다"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
