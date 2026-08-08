import Link from "next/link";
import { Clock, Leaf, Sprout } from "lucide-react";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const { count: menteeCount } = await supabase
    .from("mentees")
    .select("*", { count: "exact", head: true });

  const { data: events, error: eventsError } = await supabase
    .from("center_events")
    .select(
      "id, title, event_type, start_date, end_date, location, description, photo_urls",
    )
    .order("start_date");

  const today = new Date();
  const { start, end } = getWeekRange(today);
  const weekEvents = (events ?? []).filter(
    (event) => event.start_date <= end && event.end_date >= start,
  );

  const greetingName = mentor?.name?.trim();
  const greeting = greetingName?.includes("@")
    ? "오늘도 새싹들과 함께 자라나요"
    : greetingName
      ? `${greetingName} 선생님, 오늘도 새싹들과 함께 자라나요`
      : "오늘도 새싹들과 함께 자라나요";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-6 shadow-sm sm:px-8">
        <Leaf
          className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 rotate-12 text-emerald-100"
          strokeWidth={1.5}
          aria-hidden
        />
        <Sprout
          className="pointer-events-none absolute -right-2 -bottom-8 h-24 w-24 text-emerald-50"
          strokeWidth={1.5}
          aria-hidden
        />

        <div className="relative flex flex-wrap items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <Sprout className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            새싹일기
          </span>
          <span className="hidden h-5 w-px bg-emerald-200 sm:block" aria-hidden />
          <p className="text-sm text-stone-700 sm:text-base">{greeting} 🌱</p>
        </div>
      </div>

      {eventsError && (
        <p className="text-sm text-red-600">
          센터 행사를 불러오지 못했습니다: {eventsError.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EventsCalendar events={events ?? []} />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-stone-500">오늘</p>
            <p className="mt-2 text-lg font-semibold text-stone-900">
              {dateFormatter.format(today)}
            </p>
          </div>

          <Link
            href="/mentees"
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
          >
            <p className="text-xs text-stone-500">전체 멘티</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {menteeCount ?? 0}명
            </p>
          </Link>

          <Link
            href="/events"
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
          >
            <p className="text-xs text-stone-500">이번 주 센터 행사</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {weekEvents.length}건
            </p>
            {weekEvents.length > 0 && (
              <ul className="mt-2 flex flex-col gap-0.5">
                {weekEvents.slice(0, 2).map((event) => (
                  <li
                    key={event.id}
                    className="truncate text-xs text-stone-500"
                  >
                    {event.title}
                  </li>
                ))}
              </ul>
            )}
          </Link>
        </div>
      </div>

      <Link
        href="/schedule"
        className="flex items-center justify-between rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
      >
        <span className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600" aria-hidden />
          <span className="text-sm font-medium text-stone-900">
            센터 주간 시간표
          </span>
        </span>
        <span className="text-sm text-emerald-700">보기 →</span>
      </Link>
    </div>
  );
}
