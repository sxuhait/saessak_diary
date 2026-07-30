"use client";

import { useActionState, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import type { EventType } from "../actions";
import { deleteEvent, updateEvent, type EventActionState } from "./actions";

type CenterEvent = {
  id: string;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string | null;
  description: string | null;
  schedule: string | null;
};

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "field_trip", label: "견학" },
  { value: "camp", label: "캠프" },
  { value: "other", label: "기타" },
];

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  field_trip: "견학",
  camp: "캠프",
  other: "기타",
};

function fromISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const initialState: EventActionState = {};

function EditEventForm({
  event,
  onCancel,
}: {
  event: CenterEvent;
  onCancel: () => void;
}) {
  const action = updateEvent.bind(null, event.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-6"
    >
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium text-stone-700">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={event.title}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
          defaultValue={event.event_type}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
          <DatePicker name="start_date" defaultValue={event.start_date} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-700">종료일</label>
          <DatePicker name="end_date" defaultValue={event.end_date} />
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
          defaultValue={event.location ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
          defaultValue={event.description ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
          rows={5}
          defaultValue={event.schedule ?? ""}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function EventDetail({ event }: { event: CenterEvent }) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${event.title}" 행사를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    await deleteEvent(event.id);
    setDeleting(false);
  }

  if (isEditing) {
    return (
      <EditEventForm event={event} onCancel={() => setIsEditing(false)} />
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold text-stone-900">
          {event.title}
        </h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
          {EVENT_TYPE_LABELS[event.event_type]}
        </span>
      </div>

      <div className="flex flex-col gap-1 text-sm text-stone-700">
        <p>
          <span className="font-medium text-stone-500">날짜</span>{" "}
          {event.start_date === event.end_date
            ? dateFormatter.format(fromISODate(event.start_date))
            : `${dateFormatter.format(fromISODate(event.start_date))} ~ ${dateFormatter.format(fromISODate(event.end_date))}`}
        </p>
        {event.location && (
          <p>
            <span className="font-medium text-stone-500">장소</span>{" "}
            {event.location}
          </p>
        )}
      </div>

      {event.description && (
        <div>
          <h3 className="text-sm font-medium text-stone-500">설명</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
            {event.description}
          </p>
        </div>
      )}

      {event.schedule && (
        <div>
          <h3 className="text-sm font-medium text-stone-500">상세 일정</h3>
          <p className="mt-1 whitespace-pre-wrap rounded-md bg-stone-50 p-3 text-sm text-stone-700">
            {event.schedule}
          </p>
        </div>
      )}

      <div className="flex gap-2 border-t border-stone-200 pt-4">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </div>
  );
}
