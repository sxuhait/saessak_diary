import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AttendanceCalendar } from "./attendance-calendar";

export default async function MenteeAttendancePage({
  params,
}: {
  params: Promise<{ menteeId: string }>;
}) {
  const { menteeId } = await params;

  const supabase = await createClient();

  const { data: mentee, error } = await supabase
    .from("mentees")
    .select("id, name, school, grade")
    .eq("id", menteeId)
    .maybeSingle();

  if (error || !mentee) {
    notFound();
  }

  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, session_date, status, reason")
    .eq("mentee_id", menteeId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link
          href={`/mentees/${mentee.id}`}
          className="text-sm text-stone-500 hover:text-emerald-700"
        >
          ← {mentee.name} 일지로
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">
          {mentee.name} 출석 체크
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {[mentee.school, mentee.grade].filter(Boolean).join(" · ")}
        </p>
      </div>

      <AttendanceCalendar menteeId={mentee.id} attendance={attendance ?? []} />
    </div>
  );
}
