import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { AttendanceCalendar } from "./attendance-calendar";

export default async function MenteeAttendancePage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const { menteeId } = await params;

  const supabase = await createClient();

  const [{ data: mentee, error }, { data: attendance }] = await Promise.all([
    supabase.from("mentees").select("id, name, school, grade").eq("id", menteeId).maybeSingle(),
    supabase.from("attendance").select("id, session_date, status, reason").eq("mentee_id", menteeId),
  ]);

  if (error || !mentee) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref={`/mentees/${mentee.id}`}
        backLabel={`${mentee.name} 일지로`}
        title={`${mentee.name} 출석 체크`}
        description={[mentee.school, mentee.grade].filter(Boolean).join(" · ")}
      />

      <AttendanceCalendar menteeId={mentee.id} attendance={attendance ?? []} />
    </div>
  );
}
