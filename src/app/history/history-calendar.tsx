"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { cardClassName } from "@/components/ui/card";
import { fieldClass } from "@/components/ui/form";

type HistoryLog = {
  id: string;
  session_date: string;
  subject: string | null;
  progress: string | null;
  content: string;
  menteeId: string;
  menteeName: string;
};

type MenteeOption = { id: string; name: string };

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

const monthFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
});

export function HistoryCalendar({
  logs,
  mentees,
}: {
  logs: HistoryLog[];
  mentees: MenteeOption[];
}) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [menteeFilter, setMenteeFilter] = useState("");

  const filteredLogs = useMemo(
    () => (menteeFilter ? logs.filter((log) => log.menteeId === menteeFilter) : logs),
    [logs, menteeFilter],
  );

  const datesWithLogs = useMemo(
    () => filteredLogs.map((log) => fromISODate(log.session_date)),
    [filteredLogs],
  );

  const monthLogs = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    return filteredLogs.filter((log) => {
      const date = fromISODate(log.session_date);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
  }, [filteredLogs, month]);

  const activeMenteeCount = useMemo(
    () => new Set(monthLogs.map((log) => log.menteeId)).size,
    [monthLogs],
  );

  const selectedLogs = useMemo(() => {
    if (!selected) return [];
    const iso = toISODate(selected);
    return filteredLogs.filter((log) => log.session_date === iso);
  }, [selected, filteredLogs]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-1">
        <div className={cardClassName}>
          <h2 className="text-base font-semibold text-stone-900">일지 달력</h2>

          <div className="mt-3">
            <label htmlFor="history-mentee-filter" className="sr-only">
              멘티 필터
            </label>
            <select
              id="history-mentee-filter"
              value={menteeFilter}
              onChange={(e) => setMenteeFilter(e.target.value)}
              className={fieldClass}
            >
              <option value="">전체 멘티</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.id}>
                  {mentee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-center">
            <DayPicker
              mode="single"
              locale={ko}
              selected={selected}
              onSelect={setSelected}
              month={month}
              onMonthChange={setMonth}
              modifiers={{ hasLog: datesWithLogs }}
              modifiersClassNames={{ hasLog: "has-log" }}
            />
          </div>
        </div>

        <div className={cardClassName}>
          <h2 className="text-sm font-medium text-stone-500">
            {monthFormatter.format(month)} 요약
          </h2>
          <div className="mt-3 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-stone-900">{monthLogs.length}</p>
              <p className="mt-1 text-xs text-stone-500">이번 달 일지</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-stone-900">{activeMenteeCount}</p>
              <p className="mt-1 text-xs text-stone-500">활동 멘티</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className={cardClassName}>
          <h2 className="text-base font-semibold text-stone-900">
            {selected ? dateFormatter.format(selected) : "날짜를 선택하세요"}
          </h2>

          {!selected ? (
            <p className="mt-3 text-sm text-stone-500">
              왼쪽 달력에서 날짜를 클릭하면 그 날 작성된 일지를 볼 수 있습니다.
            </p>
          ) : selectedLogs.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">이 날짜에 작성된 일지가 없습니다.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {selectedLogs.map((log) => (
                <li key={log.id} className="rounded-2xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {log.menteeName}
                      </span>
                      {log.subject && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                          {log.subject}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/mentees/${log.menteeId}`}
                      className="shrink-0 text-xs text-emerald-700 hover:text-emerald-800"
                    >
                      자세히 보기 →
                    </Link>
                  </div>
                  {log.progress && (
                    <p className="mt-2 text-xs text-stone-500">진도: {log.progress}</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{log.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
