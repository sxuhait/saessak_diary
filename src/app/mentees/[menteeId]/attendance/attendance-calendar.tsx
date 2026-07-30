"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { getHolidayName, isCenterClosed } from "@/lib/holidays";
import {
  clearAttendance,
  setAttendance,
  type AttendanceActionState,
  type AttendanceStatus,
} from "./actions";

type AttendanceSummary = {
  id: string;
  session_date: string;
  status: AttendanceStatus;
  reason: string | null;
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

const STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  activeClassName: string;
}[] = [
  {
    value: "present",
    label: "왔음",
    activeClassName: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    value: "absent",
    label: "결석",
    activeClassName: "border-red-600 bg-red-600 text-white",
  },
  {
    value: "late",
    label: "지각",
    activeClassName: "border-amber-500 bg-amber-500 text-white",
  },
  {
    value: "excused",
    label: "사유결석",
    activeClassName: "border-stone-500 bg-stone-500 text-white",
  },
];

const STATUS_MODIFIER_CLASSNAMES: Record<AttendanceStatus, string> = {
  present: "att-present",
  absent: "att-absent",
  late: "att-late",
  excused: "att-excused",
};

function DayPanel({
  selected,
  record,
  onSetStatus,
  onClear,
}: {
  selected: Date;
  record: AttendanceSummary | undefined;
  onSetStatus: (
    status: AttendanceStatus,
    reason: string | null,
  ) => Promise<AttendanceActionState>;
  onClear: () => Promise<AttendanceActionState>;
}) {
  // Initial state is derived from `record` once; switching to a different
  // day remounts this component (see `key` at the call site) so this never
  // needs to be resynced from an effect.
  //
  // `selectedStatus` drives BOTH which button is highlighted and whether the
  // reason form shows — not `record.status` directly. `record` only reflects
  // what's actually saved, but late/excused don't save until the reason form
  // is submitted, so the highlight would otherwise lag a click behind (or
  // keep showing the previously *saved* status while a different one is
  // being composed).
  const [selectedStatus, setSelectedStatus] = useState<
    AttendanceStatus | undefined
  >(record?.status);
  const [reasonDraft, setReasonDraft] = useState(record?.reason ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(status: AttendanceStatus, reason: string | null) {
    setPending(true);
    setError(null);
    const result = await onSetStatus(status, reason);
    setPending(false);
    if (result.error) {
      setError(result.error);
    }
  }

  async function handleClear() {
    setPending(true);
    setError(null);
    const result = await onClear();
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelectedStatus(undefined);
    setReasonDraft("");
  }

  function handleStatusClick(status: AttendanceStatus) {
    if (selectedStatus === status) {
      // Clicking the already-selected button again is an undo. Only hit the
      // database if this status was actually saved -- a late/excused click
      // that's still mid-composing its reason (never submitted) has nothing
      // saved to delete, so just back out of the local selection.
      if (record?.status === status) {
        handleClear();
      } else {
        setSelectedStatus(undefined);
        setReasonDraft("");
      }
      return;
    }

    if (status === "late" || status === "excused") {
      // Switching to a status other than the one currently shown starts
      // its reason fresh; re-clicking the already-shown one keeps the draft.
      setReasonDraft(record?.status === status ? (record.reason ?? "") : "");
      setSelectedStatus(status);
      return;
    }
    setSelectedStatus(status);
    handleSetStatus(status, null);
  }

  return (
    <div className="mt-4 border-t border-stone-200 pt-4">
      <h3 className="text-sm font-medium text-stone-500">
        {dateFormatter.format(selected)}
      </h3>

      <div className="mt-2 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isActive = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={pending}
              onClick={() => handleStatusClick(option.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                isActive
                  ? option.activeClassName
                  : "border-stone-300 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {(selectedStatus === "late" || selectedStatus === "excused") && (
        <div className="mt-3 flex flex-col gap-2">
          <label
            htmlFor="attendance-reason"
            className="text-sm font-medium text-stone-700"
          >
            {selectedStatus === "late" ? "지각 사유" : "결석 사유"}
          </label>
          <textarea
            id="attendance-reason"
            rows={2}
            value={reasonDraft}
            onChange={(e) => setReasonDraft(e.target.value)}
            placeholder={
              selectedStatus === "late"
                ? "예: 버스를 놓침, 늦잠 등"
                : "예: 병원 진료, 가족 행사 등"
            }
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => handleSetStatus(selectedStatus, reasonDraft)}
            className="w-fit rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "저장 중..." : "사유 저장"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function AttendanceCalendar({
  menteeId,
  attendance,
}: {
  menteeId: string;
  attendance: AttendanceSummary[];
}) {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  const attendanceByDate = useMemo(
    () => new Map(attendance.map((a) => [a.session_date, a])),
    [attendance],
  );

  const datesByStatus = useMemo(() => {
    const map: Record<AttendanceStatus, Date[]> = {
      present: [],
      absent: [],
      late: [],
      excused: [],
    };
    for (const a of attendance) {
      map[a.status].push(fromISODate(a.session_date));
    }
    return map;
  }, [attendance]);

  const selectedIso = selected ? toISODate(selected) : undefined;
  const selectedRecord = selectedIso
    ? attendanceByDate.get(selectedIso)
    : undefined;

  async function handleSetStatus(
    status: AttendanceStatus,
    reason: string | null,
  ): Promise<AttendanceActionState> {
    if (!selectedIso) return {};
    return setAttendance(menteeId, selectedIso, status, reason);
  }

  async function handleClearStatus(): Promise<AttendanceActionState> {
    if (!selectedIso) return {};
    return clearAttendance(menteeId, selectedIso);
  }

  return (
    <div className="w-full rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex justify-center">
        <DayPicker
          mode="single"
          locale={ko}
          selected={selected}
          onSelect={setSelected}
          modifiers={{
            present: datesByStatus.present,
            absent: datesByStatus.absent,
            late: datesByStatus.late,
            excused: datesByStatus.excused,
            dayOff: isCenterClosed,
          }}
          modifiersClassNames={{ ...STATUS_MODIFIER_CLASSNAMES, dayOff: "day-off" }}
        />
      </div>

      {selected && selectedIso && isCenterClosed(selected) && (
        <div className="mt-4 border-t border-stone-200 pt-4">
          <h3 className="text-sm font-medium text-stone-500">
            {dateFormatter.format(selected)}
          </h3>
          <p className="mt-2 text-sm text-stone-500">
            센터 휴무일입니다
            {getHolidayName(selected) ? ` (${getHolidayName(selected)})` : " (주말)"}
            .
          </p>
        </div>
      )}

      {selected && selectedIso && !isCenterClosed(selected) && (
        <DayPanel
          key={selectedIso}
          selected={selected}
          record={selectedRecord}
          onSetStatus={handleSetStatus}
          onClear={handleClearStatus}
        />
      )}
    </div>
  );
}
