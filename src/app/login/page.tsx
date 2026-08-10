import { AuthSplitLayout } from "@/components/auth-split-layout";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AuthSplitLayout>
      <LoginForm notice={notice} />
    </AuthSplitLayout>
  );
}
