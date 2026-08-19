import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { MyLogsList } from "./my-logs-list";

export default async function MyLogsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: logRows, error } = await supabase
    .from("session_logs")
    .select(
      "id, session_date, content, mentee_id, mentees(name), session_log_subjects(subject, position)",
    )
    .eq("mentor_id", user?.id ?? "")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("position", { referencedTable: "session_log_subjects", ascending: true });

  const logs = (logRows ?? []).map((log) => ({
    id: log.id,
    session_date: log.session_date,
    subjects: log.session_log_subjects.map((s) => s.subject),
    content: log.content,
    menteeId: log.mentee_id,
    menteeName: log.mentees?.name ?? "알 수 없음",
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="내 일지"
        description="내가 작성한 일지를 모아봅니다."
      />

      {error && (
        <p className="text-sm text-red-600">
          일지를 불러오지 못했습니다: {error.message}
        </p>
      )}

      <MyLogsList logs={logs} />
    </div>
  );
}
