"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { fieldClass, secondaryPillClass } from "@/components/ui/form";
import { COMMON_SUBJECTS } from "@/lib/subjects";

export type SubjectRowValue = { subject: string; progress: string };

let rowIdCounter = 0;
function nextRowId() {
  rowIdCounter += 1;
  return `subject-row-${rowIdCounter}`;
}

type Row = SubjectRowValue & { id: string };

// Renders as repeatable 과목+학습량 rows, each a plain name="subject"/
// name="progress" input pair -- submitted as parallel FormData.getAll()
// arrays (paired by index) rather than a single hidden JSON field, since
// these are flat strings with no nesting to encode. createSessionLog/
// updateSessionLog (./actions.ts) zip the two arrays back together and drop
// any row whose subject is blank.
export function SubjectRowsEditor({
  defaultRows = [],
  datalistId,
}: {
  defaultRows?: SubjectRowValue[];
  datalistId: string;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    defaultRows.map((row) => ({ ...row, id: nextRowId() })),
  );

  function addRow() {
    setRows((prev) => [...prev, { id: nextRowId(), subject: "", progress: "" }]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function updateRow(id: string, patch: Partial<SubjectRowValue>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="text-sm text-stone-500">추가된 과목이 없습니다.</p>
      )}

      {rows.map((row) => (
        <div key={row.id} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            name="subject"
            list={datalistId}
            value={row.subject}
            onChange={(e) => updateRow(row.id, { subject: e.target.value })}
            placeholder="과목 (예: 수학)"
            aria-label="과목"
            className={`${fieldClass} min-w-0 bg-white sm:flex-1`}
          />
          <input
            type="text"
            name="progress"
            value={row.progress}
            onChange={(e) => updateRow(row.id, { progress: e.target.value })}
            placeholder="학습량 (예: 45~52p, 단어 20개)"
            aria-label="학습량"
            className={`${fieldClass} min-w-0 bg-white sm:flex-1`}
          />
          <button
            type="button"
            onClick={() => removeRow(row.id)}
            aria-label="이 과목 삭제"
            className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl border border-stone-300 text-stone-500 hover:bg-stone-50 sm:self-auto"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}

      <datalist id={datalistId}>
        {COMMON_SUBJECTS.map((subject) => (
          <option key={subject} value={subject} />
        ))}
      </datalist>

      <button type="button" onClick={addRow} className={`self-start ${secondaryPillClass}`}>
        + 과목 추가
      </button>
    </div>
  );
}
