"use client";

import { useActionState } from "react";
import { cardClassName } from "@/components/ui/card";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { createMentee, type MenteeActionState } from "./actions";

const initialState: MenteeActionState = {};

export function NewMenteeForm() {
  const [state, formAction, pending] = useActionState(
    createMentee,
    initialState,
  );

  return (
    <form
      action={formAction}
      autoComplete="off"
      className={`flex flex-col gap-4 ${cardClassName}`}
    >
      <h2 className="text-base font-semibold text-stone-900">학생 추가</h2>

      <div>
        <label htmlFor="name" className={labelClass}>
          학생 이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder="예: 김새싹"
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "추가 중..." : "학생 추가"}
        </button>
      </div>
    </form>
  );
}
