import { createClient } from "@/lib/supabase/server";
import { diagnoseLearning } from "@/lib/learning-diagnostics";
import { getMenteeDiagnosticsData } from "@/lib/mentee-diagnostics-data";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { secondaryButtonClass } from "@/components/ui/form";
import { logout } from "../actions";
import { ProfileName } from "./profile-name";
import { MenteeListPreview } from "./mentee-list-preview";
import { AlertListPreview } from "./alert-list-preview";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Alerts on the mypage only care about mentee-level pacing (no logs lately /
// attendance trouble) -- per-subject staleness and subject-balance findings
// already surface on the mentee's own page, so they're left out here.
function isMypageAlert(findingId: string) {
  return (
    findingId === "inactivity" ||
    findingId === "no-logs" ||
    findingId.startsWith("attendance-")
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mentor }, { mentees, logsByMentee, attendanceByMentee }, { data: recentLogs }] =
    await Promise.all([
      supabase.from("mentors").select("name").eq("id", user?.id ?? "").maybeSingle(),
      getMenteeDiagnosticsData(),
      supabase
        .from("session_logs")
        .select("id, session_date, mentees(name), session_log_subjects(subject, position)")
        .eq("mentor_id", user?.id ?? "")
        .order("session_date", { ascending: false })
        .order("created_at", { ascending: false })
        .order("position", { referencedTable: "session_log_subjects", ascending: true })
        .limit(5),
    ]);

  const alerts = mentees.flatMap((mentee) =>
    diagnoseLearning({
      logs: logsByMentee.get(mentee.id) ?? [],
      attendance: attendanceByMentee.get(mentee.id) ?? [],
    })
      .filter((finding) => isMypageAlert(finding.id))
      .map((finding) => ({ mentee, finding })),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="내 정보"
        description="내 프로필과 활동 현황을 확인하세요."
      />

      <Card className="flex flex-col gap-4">
        <ProfileName name={mentor?.name ?? ""} />
        <div>
          <p className="text-xs text-stone-500">이메일</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {user?.email ?? "-"}
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">전체 멘티</h2>
        <p className="mt-1 text-2xl font-semibold text-emerald-700">
          {mentees.length}명
        </p>

        {mentees.length > 0 ? (
          <MenteeListPreview mentees={mentees} />
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            등록된 멘티가 없습니다.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">챙길 거 알림</h2>

        {alerts.length === 0 ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-medium text-emerald-700">
              챙길 특이사항이 없습니다
            </p>
          </div>
        ) : (
          <AlertListPreview alerts={alerts} />
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">최근 내 활동</h2>

        {recentLogs && recentLogs.length > 0 ? (
          <ul className="mt-3 flex flex-col divide-y divide-stone-100">
            {recentLogs.map((log) => (
              <li key={log.id} className="py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-stone-900">
                    {log.mentees?.name ?? "-"}
                  </span>
                  {log.session_log_subjects.map((s, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                    >
                      {s.subject}
                    </span>
                  ))}
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {dateFormatter.format(parseLocalDate(log.session_date))}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            아직 작성한 일지가 없습니다.
          </p>
        )}
      </Card>

      <form action={logout}>
        <button type="submit" className={`w-full ${secondaryButtonClass}`}>
          로그아웃
        </button>
      </form>
    </div>
  );
}
