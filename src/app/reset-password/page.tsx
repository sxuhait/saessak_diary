import { AuthSplitLayout } from "@/components/auth-split-layout";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthSplitLayout>
      <ResetPasswordForm />
    </AuthSplitLayout>
  );
}
