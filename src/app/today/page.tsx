import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { DAY_LABELS } from "@/lib/weekday";
import { MentorScheduleManager } from "./mentor-schedule-manager";
import { VolunteerCheckin } from "./volunteer-checkin";

function todayISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default async function TodayPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date();
  const todayDayOfWeek = today.getDay();
  const todayIso = todayISODate(today);

  const [
    { data: mentor },
    { data: todaySchedules },
    { data: weekSchedules },
    { data: mySchedules },
    { data: todayVolunteers },
    { data: myCheckIn },
  ] = await Promise.all([
    supabase.from("mentors").select("role").eq("id", user?.id ?? "").maybeSingle(),
    supabase
      .from("mentor_schedules")
      .select("id, start_time, end_time, mentors(name)")
      .eq("day_of_week", todayDayOfWeek)
      .order("start_time"),
    supabase
      .from("mentor_schedules")
      .select("id, day_of_week, start_time, end_time, mentors(name)")
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("mentor_schedules")
      .select("id, day_of_week, start_time, end_time")
      .eq("mentor_id", user?.id ?? "")
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("volunteer_attendance")
      .select("id, mentors(name)")
      .eq("attendance_date", todayIso),
    supabase
      .from("volunteer_attendance")
      .select("id")
      .eq("volunteer_id", user?.id ?? "")
      .eq("attendance_date", todayIso)
      .maybeSingle(),
  ]);

  const isVolunteer = mentor?.role === "volunteer";

  const scheduleByDay = DAY_LABELS.map((label, dayOfWeek) => ({
    dayOfWeek,
    label,
    items: (weekSchedules ?? []).filter(
      (item) => item.day_of_week === dayOfWeek,
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="오늘 누가 오나요"
        description="오늘 출근하는 멘토와 참석 체크한 봉사자를 한눈에 확인하세요."
      />

      <Card>
        <h2 className="text-base font-semibold text-stone-900">
          오늘 출근 멘토
        </h2>

        {todaySchedules && todaySchedules.length > 0 ? (
          <ul className="mt-3 flex flex-col divide-y divide-stone-100">
            {todaySchedules.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="font-medium text-stone-900">
                  {item.mentors?.name ?? "-"}
                </span>
                <span className="text-stone-500">
                  {formatTime(item.start_time)}~{formatTime(item.end_time)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            오늘 등록된 출근 스케줄이 없습니다.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">
          오늘 참석 봉사자{" "}
          <span className="text-emerald-700">
            {todayVolunteers?.length ?? 0}명
          </span>
        </h2>

        {isVolunteer && (
          <div className="mt-3">
            <VolunteerCheckin checkedIn={!!myCheckIn} />
          </div>
        )}

        {todayVolunteers && todayVolunteers.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {todayVolunteers.map((item) => (
              <li
                key={item.id}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
              >
                {item.mentors?.name ?? "-"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            아직 참석 체크한 봉사자가 없습니다.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">
          이번 주 멘토 스케줄
        </h2>

        {scheduleByDay.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            등록된 출근 스케줄이 없습니다.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {scheduleByDay.map((group) => (
              <div key={group.dayOfWeek}>
                <h3 className="text-sm font-medium text-stone-500">
                  {group.label}
                </h3>
                <ul className="mt-1.5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-700"
                    >
                      {item.mentors?.name ?? "-"} {formatTime(item.start_time)}
                      ~{formatTime(item.end_time)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!isVolunteer && <MentorScheduleManager schedules={mySchedules ?? []} />}
    </div>
  );
}
