"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { error?: string; success?: boolean };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "이메일을 입력해주세요." };
  }

  const supabase = await createClient();

  // No `redirectTo` here on purpose -- the "Reset Password" email template
  // (Supabase dashboard) builds its own link from {{ .SiteURL }} +
  // {{ .TokenHash }}, pointed at our /auth/confirm route handler. See the
  // setup notes for the exact template string.
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  // Supabase's resetPasswordForEmail already responds the same way whether
  // or not the email is registered (to avoid leaking account existence), so
  // we don't special-case "not found" -- only genuine send failures (e.g.
  // rate limiting) get their own message.
  if (error && error.code === "over_email_send_rate_limit") {
    return { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." };
  }

  if (error) {
    return { error: "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }

  return { success: true };
}
