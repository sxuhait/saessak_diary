import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <LoginForm notice={notice} />
    </div>
  );
}
