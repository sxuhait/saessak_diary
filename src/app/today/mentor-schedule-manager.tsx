"use client";

import { useActionState, useState } from "react";
import { DAY_LABELS } from "@/lib/weekday";
import { cardClassName } from "@/components/ui/card";
import {
  labelClass,
  fieldClass,
  primaryButtonClass,
  textDangerActionClass,
} from "@/components/ui/form";
import {
  addMentorSchedule,
  deleteMentorSchedule,
  type TodayActionState,
} from "./actions";

type MySchedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

function formatTime(value: string) {
  return value.slice(0, 5);
}

const initialState: TodayActionState = {};

export function MentorScheduleManager({
  schedules,
}: {
  schedules: MySchedule[];
}) {
  const [state, formAction, pending] = useActionState(
    addMentorSchedule,
    initialState,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    const result = await deleteMentorSchedule(id);
    setDeletingId(null);
    if (result.error) setDeleteError(result.error);
  }

  return (
    <div className={`flex flex-col gap-4 ${cardClassName}`}>
      <h2 className="text-base font-semibold text-stone-900">내 출근 스케줄</h2>

      {schedules.length === 0 ? (
        <p className="text-sm text-stone-500">등록된 스케줄이 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-100">
          {schedules.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-stone-900">
                {DAY_LABELS[item.day_of_week]} {formatTime(item.start_time)}~
                {formatTime(item.end_time)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className={textDangerActionClass}
              >
                {deletingId === item.id ? "삭제 중..." : "삭제"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      <form
        action={formAction}
        className="flex flex-col gap-3 border-t border-stone-100 pt-4"
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label htmlFor="day_of_week" className={labelClass}>
              요일
            </label>
            <select
              id="day_of_week"
              name="day_of_week"
              defaultValue="1"
              className={fieldClass}
            >
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start_time" className={labelClass}>
              시작
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              required
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="end_time" className={labelClass}>
              종료
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              required
              className={fieldClass}
            />
          </div>
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className={`self-start ${primaryButtonClass}`}
        >
          {pending ? "추가 중..." : "일정 추가"}
        </button>
      </form>
    </div>
  );
}
