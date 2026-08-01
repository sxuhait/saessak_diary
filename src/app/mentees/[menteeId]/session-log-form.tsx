"use client";

import { useActionState } from "react";
import { DatePicker } from "@/components/date-picker";
import { COMMON_SUBJECTS } from "@/lib/subjects";
import { createSessionLog, type SessionLogState } from "./actions";

const initialState: SessionLogState = {};

export function SessionLogForm({ menteeId }: { menteeId: string }) {
  const action = createSessionLog.bind(null, menteeId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700">
          수업 날짜
        </label>
        <DatePicker name="session_date" />
      </div>

      <div className="space-y-1">
        <label htmlFor="subject" className="text-sm font-medium text-stone-700">
          과목 (선택)
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          list="subject-options"
          placeholder="예: 수학, 독서"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <datalist id="subject-options">
          {COMMON_SUBJECTS.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1">
        <label htmlFor="progress" className="text-sm font-medium text-stone-700">
          진도 (선택)
        </label>
        <input
          id="progress"
          name="progress"
          type="text"
          placeholder="예: 문제집 45~52p, 3단원"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="content" className="text-sm font-medium text-stone-700">
          일지 내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          placeholder="오늘 수업에서 다룬 내용, 멘티의 반응, 다음에 살펴볼 부분 등을 적어주세요."
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
