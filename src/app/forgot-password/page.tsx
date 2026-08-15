import { AuthSplitLayout } from "@/components/auth-split-layout";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout>
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
