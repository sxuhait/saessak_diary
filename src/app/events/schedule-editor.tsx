"use client";

import { useState } from "react";
import { fieldClass, secondaryPillClass, textDangerActionClass } from "@/components/ui/form";
import { parseSchedule, type ScheduleItem } from "@/lib/event-schedule";

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

      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="time"
            value={row.time}
            onChange={(e) => updateRow(row.id, { time: e.target.value })}
            aria-label="시간"
            className={`${fieldClass} w-36 bg-white`}
          />
          <input
            type="text"
            value={row.content}
            onChange={(e) => updateRow(row.id, { content: e.target.value })}
            placeholder="예: 센터 집합"
            aria-label="내용"
            className={`${fieldClass} flex-1 bg-white`}
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            className={textDangerActionClass}
          >
            삭제
          </button>
        </div>
      ))}

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
