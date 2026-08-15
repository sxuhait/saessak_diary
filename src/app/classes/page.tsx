import { createClient } from "@/lib/supabase/server";
import { suggestNextColor } from "@/lib/class-colors";
import { PageHeader } from "@/components/ui/page-header";
import { ClassList } from "./class-list";
import { NewClassForm } from "./new-class-form";
import { ClassCalendar } from "./class-calendar";

export default async function ClassesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: mentor }, { data: classRows, error }, { data: cancellations }] =
    await Promise.all([
      supabase.from("mentors").select("role").eq("id", user?.id ?? "").maybeSingle(),
      supabase
        .from("classes")
        .select("id, name, teacher_name, description, color, class_days(day_of_week)")
        .order("name"),
      supabase.from("class_cancellations").select("id, class_id, cancelled_date"),
    ]);

  const isAdmin = mentor?.role === "admin";

  const classes = (classRows ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    teacher_name: item.teacher_name,
    description: item.description,
    color: item.color,
    days: item.class_days.map((d) => d.day_of_week).sort((a, b) => a - b),
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="센터 수업 관리"
        description="외부 선생님이 진행하는 요일별 수업을 관리합니다. 모든 멘토가 함께 봅니다."
      />

      {error && (
        <p className="text-sm text-red-600">
          수업 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      <ClassCalendar classes={classes} cancellations={cancellations ?? []} />

      {isAdmin ? (
        <NewClassForm defaultColor={suggestNextColor(classes.length)} />
      ) : (
        <p className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-500 shadow-sm">
          새 수업 추가·수정·삭제는 관리자만 할 수 있습니다.
        </p>
      )}

      <ClassList classes={classes} isAdmin={isAdmin} />
    </div>
  );
}
