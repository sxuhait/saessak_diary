"use client";

import Link from "next/link";
import { useActionState } from "react";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.success) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-900">
          메일을 보냈습니다
        </h1>
        <p className="text-sm text-stone-500">
          입력하신 이메일 주소로 비밀번호 재설정 링크를 보냈습니다. 메일함(스팸함
          포함)을 확인한 뒤 링크를 눌러 새 비밀번호를 설정해주세요.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          ← 로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-900">
          비밀번호 찾기
        </h1>
        <p className="mt-1.5 text-sm text-stone-500">
          가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드려요.
        </p>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" disabled={pending} className={`w-full ${primaryButtonClass}`}>
        {pending ? "전송 중..." : "재설정 링크 보내기"}
      </button>

      <p className="text-center text-sm text-stone-500">
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          ← 로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}
