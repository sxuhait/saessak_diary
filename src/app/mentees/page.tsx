import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { NewMenteeForm } from "./new-mentee-form";
import { MenteeList } from "./mentee-list";

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

      <NewMenteeForm />

      {!error && mentees?.length === 0 && (
        <Card>
          <p className="text-sm text-stone-500">등록된 멘티가 없습니다.</p>
        </Card>
      )}

      {mentees && mentees.length > 0 && <MenteeList mentees={mentees} />}
    </div>
  );
}
