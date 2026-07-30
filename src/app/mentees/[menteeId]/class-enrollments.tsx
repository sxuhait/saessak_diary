"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/weekday";
import { enrollClass, unenrollClass } from "./actions";

type EnrolledClass = {
  enrollmentId: string;
  classId: string;
  name: string;
  dayOfWeek: number;
  teacherName: string | null;
};

type AvailableClass = {
  id: string;
  name: string;
  day_of_week: number;
  teacher_name: string | null;
};

export function ClassEnrollments({
  menteeId,
  enrolled,
  allClasses,
}: {
  menteeId: string;
  enrolled: EnrolledClass[];
  allClasses: AvailableClass[];
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrolledClassIds = new Set(enrolled.map((item) => item.classId));
  const availableClasses = allClasses.filter(
    (item) => !enrolledClassIds.has(item.id),
  );

  async function handleEnroll() {
    if (!selectedClassId) return;
    setEnrolling(true);
    setError(null);
    const result = await enrollClass(menteeId, selectedClassId);
    setEnrolling(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelectedClassId("");
  }

  async function handleUnenroll(enrollmentId: string) {
    setRemovingId(enrollmentId);
    setError(null);
    const result = await unenrollClass(enrollmentId);
    setRemovingId(null);
    if (result.error) {
      setError(result.error);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-medium text-stone-500">수강 중인 수업</h2>

      {enrolled.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">등록된 수업이 없습니다.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {enrolled.map((item) => (
            <li
              key={item.enrollmentId}
              className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
            >
              <span>
                {DAY_LABELS[item.dayOfWeek]} · {item.name}
                {item.teacherName ? ` (${item.teacherName})` : ""}
              </span>
              <button
                type="button"
                onClick={() => handleUnenroll(item.enrollmentId)}
                disabled={removingId === item.enrollmentId}
                className="text-emerald-700 hover:text-red-600 disabled:opacity-50"
                aria-label={`${item.name} 수강 해제`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableClasses.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">수업 선택...</option>
            {availableClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {DAY_LABELS[item.day_of_week]} · {item.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleEnroll}
            disabled={!selectedClassId || enrolling}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {enrolling ? "등록 중..." : "등록"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
