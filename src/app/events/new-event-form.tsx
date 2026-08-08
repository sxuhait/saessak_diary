"use client";

import { useActionState } from "react";
import { DatePicker } from "@/components/date-picker";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { createEvent, type EventActionState, type EventType } from "./actions";
import { ScheduleEditor } from "./schedule-editor";

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
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5"
    >
      <h4 className="text-base font-semibold text-stone-900">새 행사 추가</h4>

      <div>
        <label htmlFor="title" className={labelClass}>
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className={`${fieldClass} bg-white`}
        />
      </div>

      <div>
        <label htmlFor="event_type" className={labelClass}>
          행사 종류
        </label>
        <select
          id="event_type"
          name="event_type"
          defaultValue="other"
          className={`${fieldClass} bg-white`}
        >
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>시작일</label>
          <DatePicker name="start_date" defaultValue={defaultDate} />
        </div>
        <div>
          <label className={labelClass}>종료일</label>
          <DatePicker name="end_date" defaultValue={defaultDate} />
        </div>
      </div>

      <div>
        <label htmlFor="location" className={labelClass}>
          장소 (선택)
        </label>
        <input
          id="location"
          name="location"
          type="text"
          className={`${fieldClass} bg-white`}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          설명 (선택)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className={`${fieldClass} bg-white`}
        />
      </div>

      <div>
        <p className={labelClass}>상세 일정 (선택)</p>
        <ScheduleEditor name="schedule" />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "행사 추가"}
        </button>
      </div>
    </form>
  );
}
