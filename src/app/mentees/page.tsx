import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export default async function MenteeListPage() {
  const supabase = await createClient();

  const { data: mentees, error } = await supabase
    .from("mentees")
    .select("id, name, school, grade")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader backHref="/" backLabel="홈으로" title="멘티 목록" />

      {error && (
        <p className="text-sm text-red-600">
          멘티 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && mentees?.length === 0 && (
        <Card>
          <p className="text-sm text-stone-500">
            등록된 멘티가 없습니다. Supabase 대시보드에서 mentees 테이블에
            추가해보세요.
          </p>
        </Card>
      )}

      {mentees && mentees.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <ul className="flex flex-col divide-y divide-stone-100">
            {mentees.map((mentee) => (
              <li key={mentee.id}>
                <Link
                  href={`/mentees/${mentee.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-emerald-50"
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
      )}
    </div>
  );
}
