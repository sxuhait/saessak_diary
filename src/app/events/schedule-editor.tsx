"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { fieldClass, secondaryPillClass } from "@/components/ui/form";
import {
  isValidTimeValue,
  parseSchedule,
  type ScheduleItem,
} from "@/lib/event-schedule";

let rowIdCounter = 0;
function nextRowId() {
  rowIdCounter += 1;
  return `schedule-row-${rowIdCounter}`;
}

type Row = ScheduleItem & { id: string };

// 30-minute increments for the picker list ("09:00", "09:30", ...) --
// alongside, not instead of, direct typing.
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

// Digits-only, auto-inserts the colon once the minute portion starts (e.g.
// typing "1400" becomes "14:00" as you go) -- pure function of the digit
// content so backspacing "un-formats" naturally too.
function formatTypedTime(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// Renders as repeatable time+content rows but submits as a single hidden
// JSON field -- the server action (createEvent/updateEvent) filters blanks
// and sorts by time before saving, so this component doesn't need to.
export function ScheduleEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    parseSchedule(defaultValue).map((item) => ({ ...item, id: nextRowId() })),
  );

  function addRow() {
    setRows((prev) => [...prev, { id: nextRowId(), time: "", content: "" }]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function updateRow(id: string, patch: Partial<ScheduleItem>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  const serialized = JSON.stringify(
    rows.map(({ time, content }) => ({ time, content })),
  );

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={serialized} />

      {rows.length === 0 && (
        <p className="text-sm text-stone-400">아직 추가된 일정이 없습니다.</p>
      )}

      {rows.map((row) => {
        const timeInvalid = row.time !== "" && !isValidTimeValue(row.time);
        return (
          <div
            key={row.id}
            className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 shrink-0 gap-2">
              <div className="w-24 shrink-0">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={row.time}
                  onChange={(e) =>
                    updateRow(row.id, { time: formatTypedTime(e.target.value) })
                  }
                  placeholder="예: 1400"
                  aria-label="시간 입력"
                  pattern="([01]\d|2[0-3]):[0-5]\d"
                  title="24시간 형식으로 입력해주세요 (예: 14:00)"
                  className={`${fieldClass} min-w-0 bg-white ${
                    timeInvalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                  }`}
                />
              </div>
              <div className="w-28 shrink-0">
                <select
                  value={row.time}
                  onChange={(e) => updateRow(row.id, { time: e.target.value })}
                  aria-label="시간 목록에서 선택"
                  className={`${fieldClass} min-w-0 bg-white`}
                >
                  <option value="">직접 입력</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={row.content}
                onChange={(e) => updateRow(row.id, { content: e.target.value })}
                placeholder="예: 센터 집합, 잡월드 도착"
                aria-label="내용"
                className={`${fieldClass} min-w-0 bg-white`}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label="일정 삭제"
              className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:self-auto"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        );
      })}

      {rows.some((row) => row.time !== "" && !isValidTimeValue(row.time)) && (
        <p className="text-sm text-red-600">
          시간은 24시간 형식(HH:MM)으로 입력해주세요. 예: 14:00, 21:00
        </p>
      )}

      <button
        type="button"
        onClick={addRow}
        className={`${secondaryPillClass} self-start`}
      >
        일정 추가
      </button>
    </div>
  );
}
