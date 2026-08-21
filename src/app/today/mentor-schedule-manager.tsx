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
import { TimeField } from "@/components/ui/time-field";
import { isValidTimeValue } from "@/lib/time-format";
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
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // useActionState returns a fresh {} object on every successful submission
  // (error absent) -- adjust the controlled time fields during render (the
  // React-recommended "previous render" pattern, not an effect) so the form
  // doesn't retain the last entered values after "일정 추가" the way it did
  // before these were controlled <input type="time"> fields.
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (!state.error) {
      setStartTime("");
      setEndTime("");
    }
  }

  const startInvalid = startTime !== "" && !isValidTimeValue(startTime);
  const endInvalid = endTime !== "" && !isValidTimeValue(endTime);
  const rangeInvalid =
    !startInvalid &&
    !endInvalid &&
    startTime !== "" &&
    endTime !== "" &&
    endTime <= startTime;

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
          <div className="min-w-0">
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
          <div className="min-w-0">
            <label htmlFor="start_time" className={labelClass}>
              시작
            </label>
            <TimeField
              id="start_time"
              name="start_time"
              value={startTime}
              onChange={setStartTime}
              required
              ariaLabel="시작 시간"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="end_time" className={labelClass}>
              종료
            </label>
            <TimeField
              id="end_time"
              name="end_time"
              value={endTime}
              onChange={setEndTime}
              required
              ariaLabel="종료 시간"
            />
          </div>
        </div>

        {(startInvalid || endInvalid) && (
          <p className="text-sm text-red-600">
            시간은 24시간 형식(HH:MM)으로 입력해주세요. 예: 14:00, 21:00
          </p>
        )}
        {rangeInvalid && (
          <p className="text-sm text-red-600">
            종료 시간은 시작 시간보다 늦어야 합니다.
          </p>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || startInvalid || endInvalid || rangeInvalid}
          className={`self-start ${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {pending ? "추가 중..." : "일정 추가"}
        </button>
      </form>
    </div>
  );
}
