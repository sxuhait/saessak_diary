import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import type { FeedbackUsefulFeature } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const USEFUL_FEATURE_LABELS: Record<FeedbackUsefulFeature, string> = {
  session_log: "일지 작성",
  diagnostics: "학습 진단",
  attendance: "출석 체크",
  schedule: "시간표",
  other: "기타",
};

export default async function FeedbackListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (mentor?.role !== "admin") {
    notFound();
  }

  const { data: feedback, error } = await supabase
    .from("feedback")
    .select(
      "id, rating, comment, useful_feature, pain_point, created_at, mentors(name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="피드백 모아보기"
        description="멘토·봉사자가 남긴 피드백입니다. 관리자에게만 보입니다."
      />

      {error && (
        <p className="text-sm text-red-600">
          피드백을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {feedback && feedback.length === 0 && (
        <Card>
          <p className="text-sm text-stone-500">
            아직 도착한 피드백이 없습니다.
          </p>
        </Card>
      )}

      {feedback && feedback.length > 0 && (
        <div className="flex flex-col gap-3">
          {feedback.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-4 w-4 ${
                        value <= item.rating
                          ? "text-emerald-500"
                          : "text-stone-200"
                      }`}
                      fill={value <= item.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <span className="shrink-0 text-xs text-stone-400">
                  {dateFormatter.format(new Date(item.created_at))}
                </span>
              </div>

              {item.useful_feature && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                    유용한 기능: {USEFUL_FEATURE_LABELS[item.useful_feature]}
                  </span>
                </div>
              )}

              {item.comment && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                  {item.comment}
                </p>
              )}

              {item.pain_point && (
                <p className="mt-2 text-sm text-stone-700">
                  <span className="font-medium text-stone-500">아쉬운 점</span>{" "}
                  {item.pain_point}
                </p>
              )}

              <p className="mt-2 text-xs font-medium text-stone-500">
                {item.mentors?.name ?? "알 수 없음"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
