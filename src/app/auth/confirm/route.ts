import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Landing point for Supabase Auth email links (password reset, and any
// future email-confirmation flow) -- the "Reset Password" email template in
// the Supabase dashboard must point here (see CLAUDE.md / setup notes)
// instead of Supabase's default hosted verify URL, so the recovery session
// gets established on our own domain via verifyOtp() before handing off to
// /reset-password.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const redirectTo = request.nextUrl.clone();
      redirectTo.pathname = next;
      redirectTo.search = "";
      return NextResponse.redirect(redirectTo);
    }
  }

  const errorRedirect = request.nextUrl.clone();
  errorRedirect.pathname = "/login";
  errorRedirect.search = "?notice=reset-link-invalid";
  return NextResponse.redirect(errorRedirect);
}
