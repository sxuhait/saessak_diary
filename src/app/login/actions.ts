"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const { data: expired } = await supabase.rpc("is_volunteer_expired", {
    p_mentor_id: data.user.id,
  });

  if (expired) {
    await supabase.auth.signOut();
    return {
      error: "봉사 활동 기간이 종료되었습니다. 관리자에게 문의하세요.",
    };
  }

  redirect("/");
}
