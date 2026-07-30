import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventDetail } from "./event-detail";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("center_events")
    .select(
      "id, title, event_type, start_date, end_date, location, description, schedule",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link
        href="/events"
        className="text-sm text-stone-500 hover:text-emerald-700"
      >
        ← 행사 달력으로
      </Link>

      <EventDetail event={event} />
    </div>
  );
}
