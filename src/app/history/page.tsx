import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { HistoryCalendar } from "./history-calendar";

export default async function HistoryPage() {
  const supabase = await createClient();

  const [{ data: logRows, error }, { data: mentees }] = await Promise.all([
    supabase
      .from("session_logs")
      .select(
        "id, session_date, content, mentee_id, mentees(name), session_log_subjects(subject, progress, position)",
      )
      .order("session_date", { ascending: false })
      .order("position", { referencedTable: "session_log_subjects", ascending: true }),
    supabase.from("mentees").select("id, name").order("name"),
  ]);

  const logs = (logRows ?? []).map((log) => ({
    id: log.id,
    session_date: log.session_date,
    subjects: log.session_log_subjects.map((s) => ({
      subject: s.subject,
      progress: s.progress,
    })),
    content: log.content,
    menteeId: log.mentee_id,
    menteeName: log.mentees?.name ?? "알 수 없음",
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="기록"
        description="전체 멘티의 일지를 날짜별로 모아 봅니다."
      />

      {error && (
        <p className="text-sm text-red-600">
          일지를 불러오지 못했습니다: {error.message}
        </p>
      )}

      <HistoryCalendar logs={logs} mentees={mentees ?? []} />
    </div>
  );
}
