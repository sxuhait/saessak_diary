import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { parseSchedule, sortScheduleItems } from "@/lib/event-schedule";
import { WeeklyScheduleGrid, type ScheduleBlock } from "./weekly-schedule-grid";

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekdayRange(today: Date) {
  const dayOfWeek = today.getDay(); // 0 = Sun .. 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { monday, friday };
}

const weekHeaderFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
});

export default async function SchedulePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { monday, friday } = getWeekdayRange(new Date());
  const mondayIso = toISODate(monday);
  const fridayIso = toISODate(friday);

  const { data: mentorSchedules } = await supabase
    .from("mentor_schedules")
    .select("id, mentor_id, day_of_week, start_time, end_time, mentors(name)")
    .gte("day_of_week", 1)
    .lte("day_of_week", 5);

  const { data: events } = await supabase
    .from("center_events")
    .select("id, title, event_type, start_date, end_date, location, schedule")
    .lte("start_date", fridayIso)
    .gte("end_date", mondayIso);

  const blocks: ScheduleBlock[] = [];

  for (const item of mentorSchedules ?? []) {
    blocks.push({
      id: `mentor-${item.id}`,
      dayOfWeek: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
      category: "mentoring",
      title: "1:1 멘토링",
      subtitle: item.mentors?.name ? `멘토: ${item.mentors.name}` : null,
      mentorId: item.mentor_id,
    });
  }

  for (const event of events ?? []) {
    const scheduleItems = sortScheduleItems(parseSchedule(event.schedule));
    const anchorTime = scheduleItems.find((entry) => entry.time)?.time ?? "09:00";

    for (
      let cursor = new Date(Math.max(fromISODate(event.start_date).getTime(), monday.getTime()));
      cursor.getTime() <= Math.min(fromISODate(event.end_date).getTime(), friday.getTime());
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const dayOfWeek = cursor.getDay();
      if (dayOfWeek < 1 || dayOfWeek > 5) continue;

      blocks.push({
        id: `event-${event.id}-${toISODate(cursor)}`,
        dayOfWeek,
        startTime: anchorTime,
        endTime: null,
        category: event.event_type,
        title: event.title,
        subtitle: event.location,
        mentorId: null,
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="센터 주간 시간표"
        description={`${weekHeaderFormatter.format(monday)} - ${weekHeaderFormatter.format(friday)} · 운영시간 09:00~20:00`}
      />

      <WeeklyScheduleGrid blocks={blocks} currentUserId={user?.id} />
    </div>
  );
}
