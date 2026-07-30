"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-stone-200 bg-white p-8"
      >
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            멘토 로그인
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            새싹 다이어리에 오신 것을 환영합니다.
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-sm font-medium text-stone-700"
          >
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-stone-700"
          >
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
