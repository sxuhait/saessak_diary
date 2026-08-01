import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  diagnoseLearning,
  type DiagnosticSeverity,
} from "@/lib/learning-diagnostics";
import { logout } from "../actions";
import { ProfileName } from "./profile-name";

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

const ALERT_STYLES: Record<DiagnosticSeverity, { card: string; badge: string }> = {
  critical: {
    card: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
  warning: {
    card: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
  },
  info: {
    card: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { data: mentees } = await supabase
    .from("mentees")
    .select("id, name")
    .order("name");

  const menteeIds = (mentees ?? []).map((mentee) => mentee.id);

  const { data: logsForDiagnostics } = menteeIds.length
    ? await supabase
        .from("session_logs")
        .select("mentee_id, session_date, subject")
        .in("mentee_id", menteeIds)
    : { data: [] };

  const { data: attendanceForDiagnostics } = menteeIds.length
    ? await supabase
        .from("attendance")
        .select("mentee_id, session_date, status")
        .in("mentee_id", menteeIds)
    : { data: [] };

  const { data: recentLogs } = await supabase
    .from("session_logs")
    .select("id, session_date, subject, mentees(name)")
    .eq("mentor_id", user?.id ?? "")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const logsByMentee = new Map<
    string,
    { session_date: string; subject: string | null }[]
  >();
  for (const log of logsForDiagnostics ?? []) {
    const list = logsByMentee.get(log.mentee_id) ?? [];
    list.push({ session_date: log.session_date, subject: log.subject });
    logsByMentee.set(log.mentee_id, list);
  }

  const attendanceByMentee = new Map<
    string,
    { session_date: string; status: "present" | "absent" | "late" | "excused" }[]
  >();
  for (const record of attendanceForDiagnostics ?? []) {
    const list = attendanceByMentee.get(record.mentee_id) ?? [];
    list.push({ session_date: record.session_date, status: record.status });
    attendanceByMentee.set(record.mentee_id, list);
  }

  const alerts = (mentees ?? []).flatMap((mentee) =>
    diagnoseLearning({
      logs: logsByMentee.get(mentee.id) ?? [],
      attendance: attendanceByMentee.get(mentee.id) ?? [],
    })
      .filter((finding) => isMypageAlert(finding.id))
      .map((finding) => ({ mentee, finding })),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-xl font-semibold text-stone-900">내 정보</h1>

      <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6">
        <ProfileName name={mentor?.name ?? ""} />
        <div>
          <p className="text-xs text-stone-500">이메일</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {user?.email ?? "-"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-medium text-stone-500">내 담당 멘티</h2>
        <p className="mt-1 text-2xl font-semibold text-emerald-700">
          {mentees?.length ?? 0}명
        </p>

        {mentees && mentees.length > 0 ? (
          <ul className="mt-3 flex flex-col divide-y divide-stone-100">
            {mentees.map((mentee) => (
              <li key={mentee.id}>
                <Link
                  href={`/mentees/${mentee.id}`}
                  className="block py-2 text-sm font-medium text-stone-900 hover:text-emerald-700"
                >
                  {mentee.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            아직 배정된 멘티가 없습니다.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-medium text-stone-500">챙길 거 알림</h2>

        {alerts.length === 0 ? (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-medium text-emerald-700">
              챙길 특이사항이 없습니다
            </p>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {alerts.map(({ mentee, finding }) => {
              const style = ALERT_STYLES[finding.severity];
              return (
                <Link
                  key={`${mentee.id}-${finding.id}`}
                  href={`/mentees/${mentee.id}`}
                  className={`block rounded-lg border p-3 hover:opacity-90 ${style.card}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                    >
                      {mentee.name}
                    </span>
                    <p className="text-sm font-medium text-stone-900">
                      {finding.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-medium text-stone-500">최근 내 활동</h2>

        {recentLogs && recentLogs.length > 0 ? (
          <ul className="mt-3 flex flex-col divide-y divide-stone-100">
            {recentLogs.map((log) => (
              <li key={log.id} className="py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-stone-900">
                    {log.mentees?.name ?? "-"}
                  </span>
                  {log.subject && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      {log.subject}
                    </span>
                  )}
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
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
