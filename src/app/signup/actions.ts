"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateSignupInput, checkSignupEligibility } from "./validation";

export type SignupState = { error?: string };

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const input = { name, email, password };

  const validationError = validateSignupInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const eligibilityError = await checkSignupEligibility(input);
  if (eligibilityError) {
    return { error: eligibilityError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return { error: "이미 가입된 이메일입니다." };
      case "weak_password":
        return {
          error: "비밀번호 형식이 올바르지 않습니다. 최소 6자 이상 입력해주세요.",
        };
      case "email_address_invalid":
      case "validation_failed":
        return { error: "올바른 이메일 형식이 아닙니다." };
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return {
          error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.",
        };
      default:
        return {
          error: "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        };
    }
  }

  // 이메일 중복 가입 시 Supabase는 열거 공격 방지를 위해 에러 대신
  // identities가 빈 배열인 성공 응답을 돌려준다.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "이미 가입된 이메일입니다." };
  }

  if (data.session) {
    redirect("/");
  }

  redirect("/login?notice=check-email");
}
