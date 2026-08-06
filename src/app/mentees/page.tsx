import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MenteeListPage() {
  const supabase = await createClient();

  const { data: mentees, error } = await supabase
    .from("mentees")
    .select("id, name, school, grade")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-emerald-700">
          ← 홈으로
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">
          멘티 목록
        </h1>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          멘티 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && mentees?.length === 0 && (
        <p className="text-sm text-stone-500">
          등록된 멘티가 없습니다. Supabase 대시보드에서 mentees 테이블에
          추가해보세요.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-stone-200 rounded-lg border border-stone-200">
        {mentees?.map((mentee) => (
          <li key={mentee.id}>
            <Link
              href={`/mentees/${mentee.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50"
            >
              <span className="font-medium text-stone-900">
                {mentee.name}
              </span>
              <span className="text-sm text-stone-500">
                {[mentee.school, mentee.grade].filter(Boolean).join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
