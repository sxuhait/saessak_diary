import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventsCalendar } from "./events/events-calendar";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default async function HomePage() {
  const supabase = await createClient();

  const { count: menteeCount } = await supabase
    .from("mentees")
    .select("*", { count: "exact", head: true });

  const { data: events, error: eventsError } = await supabase
    .from("center_events")
    .select("id, title, event_type, start_date, end_date, location, description")
    .order("start_date");

  const today = new Date();
  const { start, end } = getWeekRange(today);
  const weekEvents = (events ?? []).filter(
    (event) => event.start_date <= end && event.end_date >= start,
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-xl font-semibold text-stone-900">홈</h1>

      {eventsError && (
        <p className="text-sm text-red-600">
          센터 행사를 불러오지 못했습니다: {eventsError.message}
        </p>
      )}

      <EventsCalendar events={events ?? []} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-xs text-stone-500">오늘</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {dateFormatter.format(today)}
          </p>
        </div>

        <Link
          href="/mentees"
          className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50"
        >
          <p className="text-xs text-stone-500">내가 담당한 멘티</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {menteeCount ?? 0}명
          </p>
        </Link>

        <Link
          href="/events"
          className="rounded-xl border border-stone-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50"
        >
          <p className="text-xs text-stone-500">이번 주 센터 행사</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {weekEvents.length}건
          </p>
          {weekEvents.length > 0 && (
            <ul className="mt-2 flex flex-col gap-0.5">
              {weekEvents.slice(0, 2).map((event) => (
                <li key={event.id} className="truncate text-xs text-stone-500">
                  {event.title}
                </li>
              ))}
            </ul>
          )}
        </Link>
      </div>
    </div>
  );
}
