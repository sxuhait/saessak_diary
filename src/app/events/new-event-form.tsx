"use client";

import { useActionState } from "react";
import { DatePicker } from "@/components/date-picker";
import { createEvent, type EventActionState, type EventType } from "./actions";

const initialState: EventActionState = {};

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "field_trip", label: "견학" },
  { value: "camp", label: "캠프" },
  { value: "other", label: "기타" },
];

export function NewEventForm({ defaultDate }: { defaultDate: string }) {
  const [state, formAction, pending] = useActionState(
    createEvent,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4"
    >
      <h4 className="text-sm font-medium text-stone-700">새 행사 추가</h4>

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-stone-700">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="event_type"
          className="text-sm font-medium text-stone-700"
        >
          행사 종류
        </label>
        <select
          id="event_type"
          name="event_type"
          defaultValue="other"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700">시작일</label>
          <DatePicker name="start_date" defaultValue={defaultDate} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700">종료일</label>
          <DatePicker name="end_date" defaultValue={defaultDate} />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="location"
          className="text-sm font-medium text-stone-700"
        >
          장소 (선택)
        </label>
        <input
          id="location"
          name="location"
          type="text"
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-stone-700"
        >
          설명 (선택)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="schedule"
          className="text-sm font-medium text-stone-700"
        >
          상세 일정 (선택)
        </label>
        <textarea
          id="schedule"
          name="schedule"
          rows={4}
          placeholder={"예: 1일차 09:00 출발 ...\n2일차 10:00 체험 활동 ..."}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "행사 추가"}
      </button>
    </form>
  );
}
