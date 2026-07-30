"use client";

import { useActionState } from "react";
import { DAY_LABELS } from "@/lib/weekday";
import { ColorPicker } from "@/components/color-picker";
import type { ClassColor } from "@/lib/class-colors";
import { createClass, type ClassActionState } from "./actions";

const initialState: ClassActionState = {};

export function NewClassForm({ defaultColor }: { defaultColor: ClassColor }) {
  const [state, formAction, pending] = useActionState(
    createClass,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-6"
    >
      <h2 className="text-sm font-medium text-stone-700">새 수업 추가</h2>

      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-stone-700">
          수업 이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="예: 연극수업"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="day_of_week"
          className="text-sm font-medium text-stone-700"
        >
          요일
        </label>
        <select
          id="day_of_week"
          name="day_of_week"
          defaultValue="3"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {DAY_LABELS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700">색</label>
        <ColorPicker name="color" defaultValue={defaultColor} />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="teacher_name"
          className="text-sm font-medium text-stone-700"
        >
          선생님 (선택)
        </label>
        <input
          id="teacher_name"
          name="teacher_name"
          type="text"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="description"
          className="text-sm font-medium text-stone-700"
        >
          설명 (선택)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "수업 추가"}
      </button>
    </form>
  );
}
