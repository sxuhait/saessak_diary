"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Info, TrendingUp } from "lucide-react";
import { DatePicker } from "@/components/date-picker";
import { cardClassName } from "@/components/ui/card";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { SubjectRowsEditor } from "./subject-rows-editor";
import { createSessionLog, type SessionLogState } from "./actions";

const initialState: SessionLogState = {};

function CardTitle({ icon: Icon, children }: { icon: typeof Info; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
      <Icon className="h-5 w-5 text-stone-400" aria-hidden />
      {children}
    </h2>
  );
}

export function SessionLogForm({
  menteeId,
  mentees,
  diagnosticsSlot,
}: {
  menteeId: string;
  mentees: { id: string; name: string }[];
  diagnosticsSlot: ReactNode;
}) {
  const router = useRouter();
  const action = createSessionLog.bind(null, menteeId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className={`flex flex-col gap-4 ${cardClassName}`}>
          <CardTitle icon={Info}>세션 정보</CardTitle>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mentee-switch" className={labelClass}>
                멘티
              </label>
              <select
                id="mentee-switch"
                value={menteeId}
                onChange={(e) => router.push(`/mentees/${e.target.value}`)}
                className={fieldClass}
              >
                {mentees.map((mentee) => (
                  <option key={mentee.id} value={mentee.id}>
                    {mentee.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>날짜</label>
              <DatePicker name="session_date" />
            </div>
          </div>
        </div>

        <div className={`flex flex-col gap-4 ${cardClassName}`}>
          <CardTitle icon={FileText}>활동 내용</CardTitle>

          <div>
            <label htmlFor="content" className={labelClass}>
              일지 내용 (선택)
            </label>
            <textarea
              id="content"
              name="content"
              rows={7}
              placeholder="오늘 어떤 활동을 함께 했는지, 멘티의 반응이나 특이사항 등을 자유롭게 적어주세요."
              className={fieldClass}
            />
          </div>
        </div>

        <div className={`flex flex-col gap-4 ${cardClassName}`}>
          <CardTitle icon={TrendingUp}>학습·진도</CardTitle>
          <p className="text-sm text-stone-500">
            오늘 다룬 과목과 학습량을 과목별로 나눠 기록하세요. (선택)
          </p>
          <SubjectRowsEditor datalistId="subject-options-new" />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-1">
        {diagnosticsSlot}

        <div className={`flex flex-col gap-3 ${cardClassName}`}>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </form>
  );
}
