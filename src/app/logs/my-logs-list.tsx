"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cardClassName } from "@/components/ui/card";
import { fieldClass, labelClass } from "@/components/ui/form";

type MyLog = {
  id: string;
  session_date: string;
  subject: string | null;
  content: string;
  menteeId: string;
  menteeName: string;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatSessionDate(sessionDate: string) {
  const [year, month, day] = sessionDate.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

export function MyLogsList({ logs }: { logs: MyLog[] }) {
  const [menteeQuery, setMenteeQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      if (log.subject) set.add(log.subject);
    }
    return [...set].sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const trimmedMentee = menteeQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (trimmedMentee && !log.menteeName.toLowerCase().includes(trimmedMentee)) {
        return false;
      }
      if (subjectFilter && log.subject !== subjectFilter) {
        return false;
      }
      if (dateFilter && log.session_date !== dateFilter) {
        return false;
      }
      return true;
    });
  }, [logs, menteeQuery, subjectFilter, dateFilter]);

  const hasFilters = menteeQuery.trim() || subjectFilter || dateFilter;

  return (
    <div className="flex flex-col gap-4">
      <div className={cardClassName}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="log-mentee-search" className={labelClass}>
              멘티 검색
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden
              />
              <input
                id="log-mentee-search"
                type="text"
                value={menteeQuery}
                onChange={(e) => setMenteeQuery(e.target.value)}
                placeholder="멘티 이름 검색"
                className={`${fieldClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="log-subject-filter" className={labelClass}>
              과목
            </label>
            <select
              id="log-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={fieldClass}
            >
              <option value="">전체 과목</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="log-date-filter" className={labelClass}>
              날짜
            </label>
            <input
              id="log-date-filter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-stone-500">검색 결과 {filtered.length}건</p>
            <button
              type="button"
              onClick={() => {
                setMenteeQuery("");
                setSubjectFilter("");
                setDateFilter("");
              }}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className={cardClassName}>
          <p className="text-sm text-stone-500">아직 작성한 일지가 없습니다.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={cardClassName}>
          <p className="text-sm text-stone-500">조건에 맞는 일지가 없습니다.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((log) => (
            <li key={log.id}>
              <Link
                href={`/mentees/${log.menteeId}`}
                className="block rounded-2xl border border-stone-200 bg-white p-5 shadow-soft hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-stone-900">
                      {formatSessionDate(log.session_date)}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {log.menteeName}
                    </span>
                    {log.subject && (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        {log.subject}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-stone-700">{log.content}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
