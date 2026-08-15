"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { DAY_LABELS } from "@/lib/weekday";
import { getHolidayName, isCenterClosed } from "@/lib/holidays";
import { CLASS_COLOR_DOT_CLASS, type ClassColor } from "@/lib/class-colors";
import { cardClassName } from "@/components/ui/card";
import { cancelClassOccurrence, uncancelClassOccurrence } from "./actions";

type ClassItem = {
  id: string;
  name: string;
  days: number[];
  teacher_name: string | null;
  color: ClassColor;
};

type Cancellation = {
  id: string;
  class_id: string;
  cancelled_date: string;
};

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function ClassCalendar({
  classes,
  cancellations,
}: {
  classes: ClassItem[];
  cancellations: Cancellation[];
}) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const classesByDay = useMemo(() => {
    const map: Record<number, ClassItem[]> = {};
    for (const item of classes) {
      for (const day of item.days) {
        map[day] = [...(map[day] ?? []), item];
      }
    }
    return map;
  }, [classes]);

  const cancellationByKey = useMemo(
    () =>
      new Map(
        cancellations.map((c) => [`${c.class_id}:${c.cancelled_date}`, c]),
      ),
    [cancellations],
  );

  function DayButtonWithClasses({
    day,
    // Not used for styling here (day-of-week + cancellation lookups below
    // decide everything) but must be destructured out so it isn't spread
    // onto the DOM <button> element via `...rest`.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    modifiers,
    className,
    children,
    ...rest
  }: DayButtonProps) {
    const dayOfWeek = day.date.getDay();
    const iso = toISODate(day.date);
    const closed = isCenterClosed(day.date);
    const todaysClasses = closed ? [] : (classesByDay[dayOfWeek] ?? []);

    return (
      <button
        className={`${className ?? ""} ${closed ? "day-off" : ""}`.trim()}
        {...rest}
      >
        {children}
        {todaysClasses.length > 0 && (
          <span className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 gap-0.5">
            {todaysClasses.map((item) => {
              const cancelled = cancellationByKey.has(`${item.id}:${iso}`);
              return (
                <span
                  key={item.id}
                  className={`h-1.5 w-1.5 rounded-full ${
                    cancelled ? "bg-stone-300" : CLASS_COLOR_DOT_CLASS[item.color]
                  }`}
                />
              );
            })}
          </span>
        )}
      </button>
    );
  }

  const selectedDayOfWeek = selected?.getDay();
  const selectedIso = selected ? toISODate(selected) : undefined;
  const selectedClosed = selected ? isCenterClosed(selected) : false;
  const selectedClasses =
    !selectedClosed && selectedDayOfWeek !== undefined
      ? (classesByDay[selectedDayOfWeek] ?? [])
      : [];

  async function handleToggleCancel(item: ClassItem) {
    if (!selectedIso) return;
    setPendingId(item.id);
    setError(null);
    const existing = cancellationByKey.get(`${item.id}:${selectedIso}`);
    const result = existing
      ? await uncancelClassOccurrence(existing.id)
      : await cancelClassOccurrence(item.id, selectedIso);
    setPendingId(null);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className={`w-full ${cardClassName}`}>
      <div className="flex justify-center">
        <DayPicker
          mode="single"
          locale={ko}
          selected={selected}
          onSelect={setSelected}
          components={{ DayButton: DayButtonWithClasses }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 border-t border-stone-200 pt-4 text-xs text-stone-500">
        {classes.map((item) => (
          <span key={item.id} className="flex items-center gap-1">
            <span
              className={`h-2.5 w-2.5 rounded-full ${CLASS_COLOR_DOT_CLASS[item.color]}`}
            />
            {item.name}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          휴강
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-100 ring-1 ring-stone-200" />
          센터 휴무일 (주말·공휴일)
        </span>
      </div>

      {selected && selectedIso && selectedDayOfWeek !== undefined && (
        <div className="mt-4 border-t border-stone-200 pt-4">
          <h3 className="text-sm font-medium text-stone-500">
            {dateFormatter.format(selected)} ({DAY_LABELS[selectedDayOfWeek]})
          </h3>

          {selectedClosed ? (
            <p className="mt-2 text-sm text-stone-500">
              센터 휴무일입니다
              {getHolidayName(selected) ? ` (${getHolidayName(selected)})` : " (주말)"}
              .
            </p>
          ) : selectedClasses.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              이 요일에 예정된 수업이 없습니다.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {selectedClasses.map((item) => {
                const isCancelled = cancellationByKey.has(
                  `${item.id}:${selectedIso}`,
                );
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-stone-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          isCancelled
                            ? "bg-stone-300"
                            : CLASS_COLOR_DOT_CLASS[item.color]
                        }`}
                      />
                      <span>
                        <span
                          className={`text-sm font-medium ${
                            isCancelled
                              ? "text-stone-400 line-through"
                              : "text-stone-900"
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.teacher_name && (
                          <span className="ml-2 text-xs text-stone-500">
                            {item.teacher_name} 선생님
                          </span>
                        )}
                        {isCancelled && (
                          <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
                            휴강
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleCancel(item)}
                      disabled={pendingId === item.id}
                      className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                        isCancelled
                          ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          : "border-stone-300 text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      {pendingId === item.id
                        ? "처리 중..."
                        : isCancelled
                          ? "휴강 해제"
                          : "이번 주 휴강 처리"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
