"use server";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type FeedbackActionState = { error?: string };

export type FeedbackUsefulFeature = Enums<"feedback_useful_feature">;

export type SubmitFeedbackInput = {
  rating: number;
  comment: string;
  usefulFeature: FeedbackUsefulFeature | null;
  painPoint: string;
};

export async function submitFeedback(
  input: SubmitFeedbackInput,
): Promise<FeedbackActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "별점을 선택해주세요." };
  }

  const { error } = await supabase.from("feedback").insert({
    mentor_id: user.id,
    rating: input.rating,
    comment: input.comment.trim() || null,
    useful_feature: input.usefulFeature,
    pain_point: input.painPoint.trim() || null,
  });

  if (error) {
    return { error: "피드백 전송에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  return {};
}
