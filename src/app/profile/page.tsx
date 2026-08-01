import { createClient } from "@/lib/supabase/server";
import { logout } from "../actions";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("name, phone")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-xl font-semibold text-stone-900">내 정보</h1>

      <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
        <div>
          <p className="text-xs text-stone-500">이름</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {mentor?.name ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">이메일</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {user?.email ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-stone-500">연락처</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {mentor?.phone ?? "-"}
          </p>
        </div>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
