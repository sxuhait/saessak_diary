"use client";

import Link from "next/link";
import { useActionState } from "react";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-900">
          멘토 로그인
        </h1>
        <p className="mt-1.5 text-sm text-stone-500">
          새싹 다이어리에 오신 것을 환영합니다.
        </p>
      </div>

      {notice === "check-email" && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          가입 신청이 완료되었습니다. 이메일함에서 인증 메일을 확인한 뒤
          로그인해주세요.
        </p>
      )}

      {notice === "expired" && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          봉사 활동 기간이 종료되었습니다. 관리자에게 문의하세요.
        </p>
      )}

      {notice === "password-updated" && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
        </p>
      )}

      {notice === "reset-link-invalid" && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          재설정 링크가 만료되었거나 유효하지 않습니다. 아래에서 다시
          요청해주세요.
        </p>
      )}

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

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <Link
            href="/forgot-password"
            className="mb-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button type="submit" disabled={pending} className={`w-full ${primaryButtonClass}`}>
        {pending ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-sm text-stone-500">
        아직 계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}
