import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EventsCalendar } from "./events-calendar";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("center_events")
    .select(
      "id, title, event_type, start_date, end_date, location, description, photo_urls",
    )
    .order("start_date");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="센터 행사 달력"
        description="견학, 캠프 등 센터 전체 행사를 모든 멘토가 함께 봅니다."
      />

      {error && (
        <p className="text-sm text-red-600">
          행사 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      <EventsCalendar events={events ?? []} />
    </div>
  );
}
