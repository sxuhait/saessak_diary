"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateNameState = { error?: string };

export async function updateMentorName(
  _prevState: UpdateNameState,
  formData: FormData,
): Promise<UpdateNameState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "이름을 입력해주세요." };
  }

  const { error } = await supabase
    .from("mentors")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    return { error: "이름 수정에 실패했습니다." };
  }

  revalidatePath("/profile");

  return {};
}
