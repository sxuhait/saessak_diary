import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { diagnoseLearning, type DiagnosticSeverity } from "@/lib/learning-diagnostics";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
});

const eventDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
});

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekRange(today: Date) {
  const dayOfWeek = today.getDay(); // 0 = Sun .. 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toISODate(monday), end: toISODate(sunday) };
}

const TASK_BADGE_STYLES: Record<DiagnosticSeverity, string> = {
  critical: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-emerald-100 text-emerald-700",
};

export default async function HomePage() {
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

  const { data: logRows } = menteeIds.length
    ? await supabase
        .from("session_logs")
        .select("mentee_id, session_date, subject")
        .in("mentee_id", menteeIds)
    : { data: [] };

  const { data: attendanceRows } = menteeIds.length
    ? await supabase
        .from("attendance")
        .select("mentee_id, session_date, status")
        .in("mentee_id", menteeIds)
    : { data: [] };

  const { data: events, error: eventsError } = await supabase
    .from("center_events")
    .select("id, title, start_date, location")
    .gte("end_date", toISODate(new Date()))
    .order("start_date")
    .limit(3);

  const today = new Date();
  const todayIso = toISODate(today);
  const todayDayOfWeek = today.getDay();
  const { start: weekStart, end: weekEnd } = getWeekRange(today);

  const { count: todayScheduleCount } = await supabase
    .from("mentor_schedules")
    .select("*", { count: "exact", head: true })
    .eq("day_of_week", todayDayOfWeek);

  const { count: todayVolunteerCount } = await supabase
    .from("volunteer_attendance")
    .select("*", { count: "exact", head: true })
    .eq("attendance_date", todayIso);

  const logsByMentee = new Map<
    string,
    { session_date: string; subject: string | null }[]
  >();
  for (const log of logRows ?? []) {
    const list = logsByMentee.get(log.mentee_id) ?? [];
    list.push({ session_date: log.session_date, subject: log.subject });
    logsByMentee.set(log.mentee_id, list);
  }

  const attendanceByMentee = new Map<
    string,
    { session_date: string; status: "present" | "absent" | "late" | "excused" }[]
  >();
  for (const record of attendanceRows ?? []) {
    const list = attendanceByMentee.get(record.mentee_id) ?? [];
    list.push({ session_date: record.session_date, status: record.status });
    attendanceByMentee.set(record.mentee_id, list);
  }

  const tasks = (mentees ?? [])
    .flatMap((mentee) =>
      diagnoseLearning({
        logs: logsByMentee.get(mentee.id) ?? [],
        attendance: attendanceByMentee.get(mentee.id) ?? [],
      })
        .filter((finding) => finding.severity !== "info")
        .map((finding) => ({ mentee, finding })),
    )
    .slice(0, 5);

  const weekLogCount = (logRows ?? []).filter(
    (log) => log.session_date >= weekStart && log.session_date <= weekEnd,
  ).length;
  const weekAttendanceCount = (attendanceRows ?? []).filter(
    (record) => record.session_date >= weekStart && record.session_date <= weekEnd,
  ).length;

  const greetingName = mentor?.name?.trim();
  const greeting = greetingName?.includes("@")
    ? "좋은 하루예요"
    : greetingName
      ? `안녕하세요, ${greetingName} 선생님`
      : "좋은 하루예요";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          {greeting}. 🌱
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {dateFormatter.format(today)} · 오늘의 멘토링 활동을 한눈에 확인하세요.
        </p>
      </div>

      {eventsError && (
        <p className="text-sm text-red-600">
          센터 행사를 불러오지 못했습니다: {eventsError.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                오늘 할 일
              </h2>
              {tasks.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {tasks.length}건
                </span>
              )}
            </div>

            {tasks.length === 0 ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">
                  챙길 특이사항이 없습니다. 오늘도 좋은 하루 보내세요!
                </p>
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {tasks.map(({ mentee, finding }) => (
                  <li key={`${mentee.id}-${finding.id}`}>
                    <Link
                      href={`/mentees/${mentee.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TASK_BADGE_STYLES[finding.severity]}`}
                        >
                          {mentee.name}
                        </span>
                        <span className="text-sm text-stone-900">{finding.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-emerald-700">일지 쓰기 →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/today"
              className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm text-stone-500 hover:text-emerald-700"
            >
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                오늘 출근 멘토 {todayScheduleCount ?? 0}명 · 참석 봉사자{" "}
                {todayVolunteerCount ?? 0}명
              </span>
              <span>자세히 →</span>
            </Link>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="flex h-full flex-col">
            <h2 className="flex items-center gap-2 text-base font-semibold text-stone-900">
              <CalendarDays className="h-5 w-5 text-emerald-600" aria-hidden />
              센터 소식
            </h2>

            {events && events.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
                {events.map((event) => (
                  <li key={event.id} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-stone-500">
                      {eventDateFormatter.format(parseLocalDate(event.start_date))}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-stone-900">{event.title}</p>
                    {event.location && (
                      <p className="mt-0.5 text-xs text-stone-500">{event.location}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-500">예정된 행사가 없습니다.</p>
            )}

            <Link
              href="/events"
              className="mt-4 border-t border-stone-100 pt-3 text-sm text-emerald-700 hover:text-emerald-800"
            >
              전체 행사 보기 →
            </Link>
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">주간 요약</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-stone-50 p-4 text-center">
            <p className="text-3xl font-bold text-stone-900">{weekLogCount}</p>
            <p className="mt-1 text-xs text-stone-500">이번 주 일지</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 text-center">
            <p className="text-3xl font-bold text-stone-900">{weekAttendanceCount}</p>
            <p className="mt-1 text-xs text-stone-500">이번 주 출석 체크</p>
          </div>
          <div className="rounded-xl bg-stone-50 p-4 text-center">
            <p className="text-3xl font-bold text-stone-900">{mentees?.length ?? 0}</p>
            <p className="mt-1 text-xs text-stone-500">전체 멘티</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50 p-4 text-center">
            <Sparkles className="h-6 w-6 text-amber-500" aria-hidden />
            <p className="mt-1 text-xs font-medium text-amber-700">멋진 한 주예요!</p>
          </div>
        </div>
      </Card>

      <Link
        href="/schedule"
        className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-soft hover:border-emerald-300 hover:bg-emerald-50"
      >
        <span className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" aria-hidden />
          <span className="text-sm font-medium text-stone-900">센터 주간 시간표</span>
        </span>
        <span className="text-sm text-emerald-700">보기 →</span>
      </Link>
    </div>
  );
}
