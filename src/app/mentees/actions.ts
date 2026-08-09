"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MenteeActionState = { error?: string };

export async function createMentee(
  _prevState: MenteeActionState,
  formData: FormData,
): Promise<MenteeActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "학생 이름을 입력해주세요." };
  }

  const { data: mentee, error } = await supabase
    .from("mentees")
    .insert({ name })
    .select("id")
    .single();

  if (error || !mentee) {
    return { error: "학생 등록에 실패했습니다." };
  }

  revalidatePath("/mentees");
  revalidatePath("/");
  revalidatePath("/profile");

  // Straight into the log-writing page -- adding a student is almost always
  // followed immediately by writing their first entry.
  redirect(`/mentees/${mentee.id}`);
}

export async function updateMenteeName(
  menteeId: string,
  formData: FormData,
): Promise<MenteeActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "학생 이름을 입력해주세요." };
  }

  const { error } = await supabase
    .from("mentees")
    .update({ name })
    .eq("id", menteeId);

  if (error) {
    return { error: "학생 정보 수정에 실패했습니다." };
  }

  revalidatePath("/mentees");
  revalidatePath(`/mentees/${menteeId}`);
  revalidatePath("/profile");

  return {};
}

export async function deleteMentee(
  menteeId: string,
): Promise<MenteeActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("mentees").delete().eq("id", menteeId);

  if (error) {
    return { error: "학생 삭제에 실패했습니다." };
  }

  revalidatePath("/mentees");
  revalidatePath("/");
  revalidatePath("/profile");

  return {};
}
