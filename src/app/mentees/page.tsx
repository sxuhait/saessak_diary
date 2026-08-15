import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { MenteeList } from "./mentee-list";

export default async function MenteeListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mentor }, { data: mentees, error }] = await Promise.all([
    supabase.from("mentors").select("role").eq("id", user?.id ?? "").maybeSingle(),
    supabase.from("mentees").select("id, name, school, grade").order("name"),
  ]);

  const isAdmin = mentor?.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader backHref="/" backLabel="홈으로" title="멘티 목록" />

      {error && (
        <p className="text-sm text-red-600">
          멘티 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      <MenteeList mentees={mentees ?? []} isAdmin={isAdmin} />
    </div>
  );
}
