"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import type { EventType } from "./actions";
import { NewEventForm } from "./new-event-form";

type CenterEvent = {
  id: string;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  location: string | null;
  description: string | null;
};

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function eachDateInRange(startIso: string, endIso: string) {
  const dates: Date[] = [];
  const cursor = fromISODate(startIso);
  const end = fromISODate(endIso);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  field_trip: "견학",
  camp: "캠프",
  other: "기타",
};

const EVENT_TYPE_MODIFIER_CLASSNAMES: Record<EventType, string> = {
  field_trip: "evt-field-trip",
  camp: "evt-camp",
  other: "evt-other",
};

export function EventsCalendar({ events }: { events: CenterEvent[] }) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  const datesByType = useMemo(() => {
    const map: Record<EventType, Date[]> = {
      field_trip: [],
      camp: [],
      other: [],
    };
    for (const event of events) {
      map[event.event_type].push(
        ...eachDateInRange(event.start_date, event.end_date),
      );
    }
    return map;
  }, [events]);

  const selectedIso = selected ? toISODate(selected) : undefined;

  const selectedEvents = useMemo(() => {
    if (!selectedIso) return [];
    return events.filter(
      (event) =>
        event.start_date <= selectedIso && event.end_date >= selectedIso,
    );
  }, [selectedIso, events]);

  return (
    <div className="w-full rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex justify-center">
        <DayPicker
          mode="single"
          locale={ko}
          selected={selected}
          onSelect={setSelected}
          modifiers={{
            fieldTrip: datesByType.field_trip,
            camp: datesByType.camp,
            other: datesByType.other,
          }}
          modifiersClassNames={{
            fieldTrip: EVENT_TYPE_MODIFIER_CLASSNAMES.field_trip,
            camp: EVENT_TYPE_MODIFIER_CLASSNAMES.camp,
            other: EVENT_TYPE_MODIFIER_CLASSNAMES.other,
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-stone-200 pt-4 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          견학
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          캠프
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-400" />
          기타
        </span>
      </div>

      {selected && selectedIso && (
        <div className="mt-4 border-t border-stone-200 pt-4">
          <h3 className="text-sm font-medium text-stone-500">
            {dateFormatter.format(selected)}
          </h3>

          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              이 날짜에 등록된 행사가 없습니다.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.id}`}
                    className="block rounded-md bg-stone-50 p-3 hover:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-stone-900">
                        {event.title}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        {EVENT_TYPE_LABELS[event.event_type]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {event.start_date === event.end_date
                        ? dateFormatter.format(fromISODate(event.start_date))
                        : `${dateFormatter.format(fromISODate(event.start_date))} ~ ${dateFormatter.format(fromISODate(event.end_date))}`}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                    {event.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                        {event.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <NewEventForm key={selectedIso} defaultDate={selectedIso} />
        </div>
      )}
    </div>
  );
}
