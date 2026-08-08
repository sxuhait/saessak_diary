"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  labelClass,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textActionClass,
} from "@/components/ui/form";
import { updateMentorName, type UpdateNameState } from "./actions";

const initialState: UpdateNameState = {};

export function ProfileName({ name }: { name: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateMentorName,
    initialState,
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      setIsEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (isEditing) {
    return (
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label htmlFor="name" className={labelClass}>
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={name}
            className={fieldClass}
          />
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className={secondaryButtonClass}
          >
            취소
          </button>
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-stone-500">이름</p>
        <p className="mt-1 text-sm font-medium text-stone-900">{name}</p>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className={textActionClass}
      >
        수정
      </button>
    </div>
  );
}
