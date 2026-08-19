import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { flattenSubjectLogs } from "@/lib/learning-diagnostics";
import { PageHeader } from "@/components/ui/page-header";
import { secondaryPillClass } from "@/components/ui/form";
import { SessionLogForm } from "./session-log-form";
import { LogCalendar } from "./log-calendar";
import { SessionLogList } from "./session-log-list";
import { ClassEnrollments } from "./class-enrollments";
import { SubjectSummary } from "./subject-summary";
import { LearningDiagnostics } from "./learning-diagnostics";
import { PostSaveFeedbackPrompt } from "./post-save-feedback-prompt";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: mentee, error },
    { data: allMentees },
    { data: logRows, error: logsError },
    { data: enrollmentRows },
    { data: allClassRows },
    { data: attendance },
  ] = await Promise.all([
    supabase.from("mentees").select("id, name, school, grade").eq("id", menteeId).maybeSingle(),
    supabase.from("mentees").select("id, name").order("name"),
    supabase
      .from("session_logs")
      .select(
        "id, session_date, content, mentor_id, mentors(name), session_log_subjects(subject, progress, position)",
      )
      .eq("mentee_id", menteeId)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("position", { referencedTable: "session_log_subjects", ascending: true }),
    supabase
      .from("class_enrollments")
      .select("id, class_id, classes(name, teacher_name, class_days(day_of_week))")
      .eq("mentee_id", menteeId),
    supabase
      .from("classes")
      .select("id, name, teacher_name, class_days(day_of_week)")
      .order("name"),
    supabase.from("attendance").select("session_date, status").eq("mentee_id", menteeId),
  ]);

  if (error || !mentee) {
    notFound();
  }

  const logs = (logRows ?? []).map((log) => ({
    id: log.id,
    session_date: log.session_date,
    subjects: log.session_log_subjects.map((s) => ({
      subject: s.subject,
      progress: s.progress,
    })),
    content: log.content,
    authorName: log.mentors?.name ?? null,
    mentorId: log.mentor_id,
  }));

  const diagnosticsLogs = flattenSubjectLogs(logs);

  const enrolled = (enrollmentRows ?? []).flatMap((row) =>
    row.classes
      ? [
          {
            enrollmentId: row.id,
            classId: row.class_id,
            name: row.classes.name,
            days: row.classes.class_days
              .map((d) => d.day_of_week)
              .sort((a, b) => a - b),
            teacherName: row.classes.teacher_name,
          },
        ]
      : [],
  );

  const allClasses = (allClassRows ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    teacher_name: item.teacher_name,
    days: item.class_days.map((d) => d.day_of_week).sort((a, b) => a - b),
  }));

  const menteeSubtitle = [mentee.school, mentee.grade].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/mentees"
        backLabel="멘티 목록으로"
        title="새 일지 작성"
        description={`${mentee.name} 학생${menteeSubtitle ? ` · ${menteeSubtitle}` : ""}의 학습 일지를 기록하세요.`}
        action={
          <Link
            href={`/mentees/${mentee.id}/attendance`}
            className={secondaryPillClass}
          >
            출석 체크
          </Link>
        }
      />

      {saved === "1" && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          저장되었습니다.
        </p>
      )}

      <PostSaveFeedbackPrompt trigger={saved === "1"} />

      <ClassEnrollments
        menteeId={mentee.id}
        enrolled={enrolled}
        allClasses={allClasses}
      />

      <SessionLogForm
        menteeId={mentee.id}
        mentees={allMentees ?? []}
        diagnosticsSlot={
          <>
            <SubjectSummary logs={logs} />
            <LearningDiagnostics logs={diagnosticsLogs} attendance={attendance ?? []} />
          </>
        }
      />

      <LogCalendar logs={logs} />

      <div className="flex w-full flex-col gap-3">
        <h2 className="text-lg font-semibold text-stone-900">지난 일지</h2>

        {logsError && (
          <p className="text-sm text-red-600">
            일지 목록을 불러오지 못했습니다: {logsError.message}
          </p>
        )}

        {!logsError && (
          <SessionLogList logs={logs} currentMentorId={user?.id} />
        )}
      </div>
    </div>
  );
}
