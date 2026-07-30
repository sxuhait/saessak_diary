import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventsCalendar } from "./events-calendar";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("center_events")
    .select("id, title, event_type, start_date, end_date, location, description")
    .order("start_date");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-emerald-700">
          ← 홈으로
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">
          센터 행사 달력
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          견학, 캠프 등 센터 전체 행사를 모든 멘토가 함께 봅니다.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          행사 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      <EventsCalendar events={events ?? []} />
    </div>
  );
}
