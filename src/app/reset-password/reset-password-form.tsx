"use client";

import { useActionState } from "react";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { updatePassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-900">
          새 비밀번호 설정
        </h1>
        <p className="mt-1.5 text-sm text-stone-500">
          새로 사용할 비밀번호를 입력해주세요.
        </p>
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          새 비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-stone-500">최소 6자 이상 입력해주세요.</p>
      </div>

      <div>
        <label htmlFor="confirm_password" className={labelClass}>
          새 비밀번호 확인
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          autoComplete="new-password"
          minLength={6}
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" disabled={pending} className={`w-full ${primaryButtonClass}`}>
        {pending ? "변경 중..." : "비밀번호 변경"}
      </button>
    </form>
  );
}
