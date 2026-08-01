"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
      <form action={formAction} className="flex flex-col gap-2">
        <label htmlFor="name" className="text-xs text-stone-500">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={name}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "저장 중..." : "저장"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            취소
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
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        수정
      </button>
    </div>
  );
}
