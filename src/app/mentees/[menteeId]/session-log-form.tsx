"use client";

import { useActionState } from "react";
import { DatePicker } from "@/components/date-picker";
import { COMMON_SUBJECTS } from "@/lib/subjects";
import { cardClassName } from "@/components/ui/card";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { createSessionLog, type SessionLogState } from "./actions";

const initialState: SessionLogState = {};

export function SessionLogForm({ menteeId }: { menteeId: string }) {
  const action = createSessionLog.bind(null, menteeId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className={`flex w-full flex-col gap-4 ${cardClassName}`}
    >
      <h2 className="text-base font-semibold text-stone-900">일지 작성</h2>

      <div>
        <label className={labelClass}>수업 날짜</label>
        <DatePicker name="session_date" />
      </div>

      <div>
        <label htmlFor="subject" className={labelClass}>
          과목 (선택)
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          list="subject-options"
          placeholder="예: 수학, 독서"
          className={fieldClass}
        />
        <datalist id="subject-options">
          {COMMON_SUBJECTS.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor="progress" className={labelClass}>
          진도 (선택)
        </label>
        <input
          id="progress"
          name="progress"
          type="text"
          placeholder="예: 문제집 45~52p, 3단원"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="content" className={labelClass}>
          일지 내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          placeholder="오늘 수업에서 다룬 내용, 멘티의 반응, 다음에 살펴볼 부분 등을 적어주세요."
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
