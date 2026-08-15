"use client";

import { useActionState } from "react";
import { ColorPicker } from "@/components/color-picker";
import { cardClassName } from "@/components/ui/card";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import type { ClassColor } from "@/lib/class-colors";
import { createClass, type ClassActionState } from "./actions";
import { DayOfWeekCheckboxes } from "./day-of-week-checkboxes";

const initialState: ClassActionState = {};

export function NewClassForm({ defaultColor }: { defaultColor: ClassColor }) {
  const [state, formAction, pending] = useActionState(
    createClass,
    initialState,
  );

  return (
    <form action={formAction} className={`flex flex-col gap-4 ${cardClassName}`}>
      <h2 className="text-base font-semibold text-stone-900">새 수업 추가</h2>

      <div>
        <label htmlFor="name" className={labelClass}>
          수업 이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="예: 연극수업"
          className={fieldClass}
        />
      </div>

      <DayOfWeekCheckboxes idPrefix="new-class" />

      <div>
        <label className={labelClass}>색</label>
        <ColorPicker name="color" defaultValue={defaultColor} />
      </div>

      <div>
        <label htmlFor="teacher_name" className={labelClass}>
          선생님 (선택)
        </label>
        <input
          id="teacher_name"
          name="teacher_name"
          type="text"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          설명 (선택)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "수업 추가"}
        </button>
      </div>
    </form>
  );
}
