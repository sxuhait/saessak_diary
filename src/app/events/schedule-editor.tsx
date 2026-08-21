"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { fieldClass, secondaryPillClass } from "@/components/ui/form";
import { TimeField } from "@/components/ui/time-field";
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
        return (
          <div
            key={row.id}
            className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 sm:w-40 sm:shrink-0">
              <TimeField
                value={row.time}
                onChange={(time) => updateRow(row.id, { time })}
                ariaLabel="시간 입력"
              />
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
