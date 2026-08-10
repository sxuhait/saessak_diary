"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackActionState = { error?: string };

export async function submitFeedback(
  rating: number,
  comment: string,
): Promise<FeedbackActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "별점을 선택해주세요." };
  }

  const trimmedComment = comment.trim();

  const { error } = await supabase.from("feedback").insert({
    mentor_id: user.id,
    rating,
    comment: trimmedComment || null,
  });

  if (error) {
    return { error: "피드백 전송에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  return {};
}
