"use client";

import { useActionState } from "react";
import { cardClassName } from "@/components/ui/card";
import { primaryButtonClass } from "@/components/ui/form";
import { createScheduleItem, type ScheduleItemActionState } from "./actions";
import { ScheduleItemFields } from "./schedule-item-fields";

const initialState: ScheduleItemActionState = {};

export function NewScheduleItemForm() {
  const [state, formAction, pending] = useActionState(
    createScheduleItem,
    initialState,
  );

  return (
    <form action={formAction} className={`flex flex-col gap-4 ${cardClassName}`}>
      <h2 className="text-base font-semibold text-stone-900">시간표 항목 추가</h2>

      <ScheduleItemFields idPrefix="new-item" />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "추가"}
        </button>
      </div>
    </form>
  );
}
