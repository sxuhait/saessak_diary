import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SessionLogForm } from "./session-log-form";
import { LogCalendar } from "./log-calendar";
import { SessionLogList } from "./session-log-list";
import { ClassEnrollments } from "./class-enrollments";
import { SubjectSummary } from "./subject-summary";

export default async function MenteeSessionLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ menteeId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { menteeId } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();

  const { data: mentee, error } = await supabase
    .from("mentees")
    .select("id, name, school, grade")
    .eq("id", menteeId)
    .maybeSingle();

  if (error || !mentee) {
    notFound();
  }

  const { data: logs, error: logsError } = await supabase
    .from("session_logs")
    .select("id, session_date, subject, progress, content")
    .eq("mentee_id", menteeId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: enrollmentRows } = await supabase
    .from("class_enrollments")
    .select("id, class_id, classes(name, day_of_week, teacher_name)")
    .eq("mentee_id", menteeId);

  const enrolled = (enrollmentRows ?? []).flatMap((row) =>
    row.classes
      ? [
          {
            enrollmentId: row.id,
            classId: row.class_id,
            name: row.classes.name,
            dayOfWeek: row.classes.day_of_week,
            teacherName: row.classes.teacher_name,
          },
        ]
      : [],
  );

  const { data: allClasses } = await supabase
    .from("classes")
    .select("id, name, day_of_week, teacher_name")
    .order("day_of_week")
    .order("name");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link
          href="/mentees"
          className="text-sm text-stone-500 hover:text-emerald-700"
        >
          ← 멘티 목록으로
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">
              {mentee.name} 일지 작성
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {[mentee.school, mentee.grade].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Link
            href={`/mentees/${mentee.id}/attendance`}
            className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            출석 체크
          </Link>
        </div>
      </div>

      <ClassEnrollments
        menteeId={mentee.id}
        enrolled={enrolled}
        allClasses={allClasses ?? []}
      />

      {saved === "1" && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          저장되었습니다.
        </p>
      )}

      <SessionLogForm menteeId={mentee.id} />

      <LogCalendar logs={logs ?? []} />

      <SubjectSummary logs={logs ?? []} />

      <div className="flex w-full flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-500">지난 일지</h2>

        {logsError && (
          <p className="text-sm text-red-600">
            일지 목록을 불러오지 못했습니다: {logsError.message}
          </p>
        )}

        {!logsError && <SessionLogList logs={logs ?? []} />}
      </div>
    </div>
  );
}
