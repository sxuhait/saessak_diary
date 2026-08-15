import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { cardClassName } from "@/components/ui/card";
import { ScheduleTable } from "./schedule-table";
import { ScheduleManageList } from "./schedule-manage-list";
import { NewScheduleItemForm } from "./new-schedule-item-form";

const NOTES = [
  "7월 21일 한글우체부 지역탐방프로그램",
  "8월 5일 청소년 수련원 생존수영활동",
  "8월 6일~7일 강화도 1박2일 여름캠프",
  "8월 14일 만월복지관과 함께 하는 나눔교육",
  "매주 목요일 문화다양성교실",
];

export default async function SchedulePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mentor }, { data: items, error }] = await Promise.all([
    supabase.from("mentors").select("role").eq("id", user?.id ?? "").maybeSingle(),
    supabase
      .from("schedule_items")
      .select("id, day_of_week, start_time, end_time, title, subtitle, color")
      .order("day_of_week")
      .order("start_time"),
  ]);

  const isAdmin = mentor?.role === "admin";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="센터 주간 시간표"
        description="운영시간 08:00~20:00 (월~금)"
      />

      {error && (
        <p className="text-sm text-red-600">
          시간표를 불러오지 못했습니다: {error.message}
        </p>
      )}

      <ScheduleTable items={items ?? []} />

      {isAdmin ? (
        <>
          <NewScheduleItemForm />
          <ScheduleManageList items={items ?? []} isAdmin={isAdmin} />
        </>
      ) : (
        <p className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-500 shadow-sm">
          시간표 항목 추가·수정·삭제는 관리자만 할 수 있습니다.
        </p>
      )}

      <div className={cardClassName}>
        <h2 className="text-sm font-semibold text-stone-900">안내사항</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm text-stone-600">
          {NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="text-emerald-600">•</span>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
