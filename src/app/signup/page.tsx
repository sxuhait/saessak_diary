"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthSplitLayout } from "@/components/auth-split-layout";
import { labelClass, fieldClass, primaryButtonClass } from "@/components/ui/form";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <AuthSplitLayout>
      <form action={formAction} className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-stone-900">
            멘토 회원가입
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            새싹 다이어리와 함께 멘토링을 시작해보세요.
          </p>
        </div>

        <div>
          <label htmlFor="name" className={labelClass}>
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClass}
          />
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

        <div>
          <label htmlFor="password" className={labelClass}>
            비밀번호
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
          <p className="mt-1.5 text-xs text-stone-500">
            최소 6자 이상 입력해주세요.
          </p>
        </div>

        <fieldset>
          <legend className={labelClass}>역할</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 py-3 text-sm text-stone-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
              <input
                type="radio"
                name="role"
                value="mentor"
                defaultChecked
                required
                className="accent-emerald-600"
              />
              멘토
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 py-3 text-sm text-stone-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
              <input
                type="radio"
                name="role"
                value="volunteer"
                required
                className="accent-emerald-600"
              />
              봉사자
            </label>
          </div>
        </fieldset>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button type="submit" disabled={pending} className={`w-full ${primaryButtonClass}`}>
          {pending ? "가입 중..." : "회원가입"}
        </button>

        <p className="text-center text-sm text-stone-500">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-700"
          >
            로그인
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
