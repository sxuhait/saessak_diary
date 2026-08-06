import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { suggestNextColor } from "@/lib/class-colors";
import { ClassList } from "./class-list";
import { NewClassForm } from "./new-class-form";
import { ClassCalendar } from "./class-calendar";

export default async function ClassesPage() {
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

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, day_of_week, teacher_name, description, color")
    .order("day_of_week")
    .order("name");

  const { data: cancellations } = await supabase
    .from("class_cancellations")
    .select("id, class_id, cancelled_date");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:text-emerald-700">
          ← 홈으로
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-stone-900">
          센터 수업 관리
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          외부 선생님이 진행하는 요일별 수업을 관리합니다. 모든 멘토가 함께
          봅니다.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          수업 목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      <ClassCalendar
        classes={classes ?? []}
        cancellations={cancellations ?? []}
      />

      {isAdmin ? (
        <NewClassForm defaultColor={suggestNextColor(classes?.length ?? 0)} />
      ) : (
        <p className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
          새 수업 추가·수정·삭제는 관리자만 할 수 있습니다.
        </p>
      )}

      <ClassList classes={classes ?? []} isAdmin={isAdmin} />
    </div>
  );
}
