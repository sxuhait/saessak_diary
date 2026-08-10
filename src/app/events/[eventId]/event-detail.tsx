"use client";

import { useActionState, useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { cardClassName } from "@/components/ui/card";
import {
  labelClass,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textActionClass,
  textDangerActionClass,
} from "@/components/ui/form";
import type { EventType } from "../actions";
import { ScheduleEditor } from "../schedule-editor";
import { deleteEvent, updateEvent, type EventActionState } from "./actions";
import { EventPhotoGallery } from "./event-photo-gallery";
import {
  isStructuredSchedule,
  parseSchedule,
  sortScheduleItems,
} from "@/lib/event-schedule";

type CenterEvent = {
  id: string;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string | null;
  description: string | null;
  schedule: string | null;
  photo_urls: string[];
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
    <form action={formAction} className={`flex flex-col gap-4 ${cardClassName}`}>
      <div>
        <label htmlFor="title" className={labelClass}>
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={event.title}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="event_type" className={labelClass}>
          행사 종류
        </label>
        <select
          id="event_type"
          name="event_type"
          defaultValue={event.event_type}
          className={fieldClass}
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
          <DatePicker name="start_date" defaultValue={event.start_date} />
        </div>
        <div>
          <label className={labelClass}>종료일</label>
          <DatePicker name="end_date" defaultValue={event.end_date} />
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
          defaultValue={event.location ?? ""}
          className={fieldClass}
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
          defaultValue={event.description ?? ""}
          className={fieldClass}
        />
      </div>

      <div>
        <p className={labelClass}>상세 일정 (선택)</p>
        <ScheduleEditor name="schedule" defaultValue={event.schedule} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={secondaryButtonClass}
        >
          취소
        </button>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

export function EventDetail({
  event,
  isAdmin,
}: {
  event: CenterEvent;
  isAdmin: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`"${event.title}" 행사를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteEvent(event.id);
    setDeleting(false);
    if (result?.error) {
      setDeleteError(result.error);
    }
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-6">
        <EditEventForm event={event} onCancel={() => setIsEditing(false)} />
        <EventPhotoGallery eventId={event.id} photoUrls={event.photo_urls} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${cardClassName}`}>
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
          {isStructuredSchedule(event.schedule) ? (
            <div className="mt-1 overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full text-sm">
                <tbody>
                  {sortScheduleItems(parseSchedule(event.schedule)).map(
                    (item, index) => (
                      <tr
                        key={index}
                        className="border-b border-stone-100 last:border-0 odd:bg-stone-50"
                      >
                        <td className="w-24 whitespace-nowrap px-3 py-2 align-top font-medium tabular-nums text-emerald-700">
                          {item.time || "-"}
                        </td>
                        <td className="px-3 py-2 text-stone-700">
                          {item.content}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
              {event.schedule}
            </p>
          )}
        </div>
      )}

      <div className="border-t border-stone-100 pt-4">
        <EventPhotoGallery
          eventId={event.id}
          photoUrls={event.photo_urls}
          variant="inline"
        />
      </div>

      <div className="flex items-center gap-4 border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={textActionClass}
        >
          수정
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={textDangerActionClass}
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        )}
        {deleteError && (
          <span className="text-xs text-red-600">{deleteError}</span>
        )}
      </div>
    </div>
  );
}
