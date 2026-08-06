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
    .select("id, title, event_type, start_date, end_date, location, description")
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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white px-5 py-6 shadow-sm">
        <Leaf
          className="pointer-events-none absolute -top-5 -right-5 h-28 w-28 rotate-12 text-emerald-100"
          strokeWidth={1.5}
          aria-hidden
        />
        <Sprout
          className="pointer-events-none absolute -bottom-4 left-1/2 h-20 w-20 -translate-x-1/2 text-emerald-50"
          strokeWidth={1.5}
          aria-hidden
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Sprout className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-700">
            새싹일기
          </h1>
        </div>

        <p className="relative mt-2 text-sm text-stone-600">{greeting} 🌱</p>
      </div>

      {eventsError && (
        <p className="text-sm text-red-600">
          센터 행사를 불러오지 못했습니다: {eventsError.message}
        </p>
      )}

      <EventsCalendar events={events ?? []} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-stone-500">오늘</p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {dateFormatter.format(today)}
          </p>
        </div>

        <Link
          href="/mentees"
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
        >
          <p className="text-xs text-stone-500">전체 멘티</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {menteeCount ?? 0}명
          </p>
        </Link>

        <Link
          href="/events"
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
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

      <Link
        href="/schedule"
        className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
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
