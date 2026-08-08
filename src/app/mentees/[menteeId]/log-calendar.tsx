"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { cardClassName } from "@/components/ui/card";

type LogSummary = {
  id: string;
  session_date: string;
  subject: string | null;
  progress: string | null;
  content: string;
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

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function LogCalendar({ logs }: { logs: LogSummary[] }) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  const datesWithLogs = useMemo(
    () => logs.map((log) => fromISODate(log.session_date)),
    [logs],
  );

  const selectedLogs = useMemo(() => {
    if (!selected) return [];
    const iso = toISODate(selected);
    return logs.filter((log) => log.session_date === iso);
  }, [selected, logs]);

  return (
    <div className={`w-full ${cardClassName}`}>
      <h2 className="mb-4 text-base font-semibold text-stone-900">
        일지 달력
      </h2>
      <div className="flex justify-center">
        <DayPicker
          mode="single"
          locale={ko}
          selected={selected}
          onSelect={setSelected}
          modifiers={{ hasLog: datesWithLogs }}
          modifiersClassNames={{ hasLog: "has-log" }}
        />
      </div>

      {selected && (
        <div className="mt-4 border-t border-stone-200 pt-4">
          <h3 className="text-sm font-medium text-stone-500">
            {dateFormatter.format(selected)}
          </h3>

          {selectedLogs.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              이 날짜에 작성된 일지가 없습니다.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {selectedLogs.map((log) => (
                <li key={log.id} className="rounded-md bg-stone-50 p-3">
                  {log.subject && (
                    <span className="mb-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      {log.subject}
                    </span>
                  )}
                  {log.progress && (
                    <p className="mb-1 text-xs text-stone-500">
                      진도: {log.progress}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm text-stone-700">
                    {log.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
