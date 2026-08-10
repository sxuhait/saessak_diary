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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const isAdmin = mentor?.role === "admin";

  const { data: event, error } = await supabase
    .from("center_events")
    .select(
      "id, title, event_type, start_date, end_date, location, description, schedule, photo_urls",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <Link
        href="/events"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-500 hover:text-emerald-700"
      >
        ← 행사 달력으로
      </Link>

      <EventDetail event={event} isAdmin={isAdmin} />
    </div>
  );
}
