"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordState = { error?: string };

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!password || password.length < 6) {
    return { error: "비밀번호는 최소 6자 이상이어야 합니다." };
  }

  if (password !== confirmPassword) {
    return { error: "비밀번호가 서로 일치하지 않습니다." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청해주세요.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    switch (error.code) {
      case "weak_password":
        return {
          error: "비밀번호 형식이 올바르지 않습니다. 최소 6자 이상 입력해주세요.",
        };
      case "same_password":
        return { error: "이전과 다른 비밀번호를 입력해주세요." };
      default:
        return { error: "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }
  }

  await supabase.auth.signOut();

  redirect("/login?notice=password-updated");
}
