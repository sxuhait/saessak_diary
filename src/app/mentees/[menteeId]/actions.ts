"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionLogState = { error?: string };

export async function createSessionLog(
  menteeId: string,
  _prevState: SessionLogState,
  formData: FormData,
): Promise<SessionLogState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const sessionDate = String(formData.get("session_date") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const progress = String(formData.get("progress") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!sessionDate || !content) {
    return { error: "날짜와 내용을 입력해주세요." };
  }

  const { error } = await supabase.from("session_logs").insert({
    mentee_id: menteeId,
    mentor_id: user.id,
    session_date: sessionDate,
    subject: subject || null,
    progress: progress || null,
    content,
  });

  if (error) {
    return { error: "저장에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath(`/mentees/${menteeId}`);
  redirect(`/mentees/${menteeId}?saved=1`);
}

export async function updateSessionLog(
  logId: string,
  formData: FormData,
): Promise<SessionLogState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: existing } = await supabase
    .from("session_logs")
    .select("mentor_id")
    .eq("id", logId)
    .maybeSingle();

  if (!existing) {
    return { error: "일지를 찾을 수 없습니다." };
  }

  if (existing.mentor_id !== user.id) {
    return { error: "본인이 작성한 일지만 수정할 수 있습니다." };
  }

  const sessionDate = String(formData.get("session_date") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const progress = String(formData.get("progress") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!sessionDate || !content) {
    return { error: "날짜와 내용을 입력해주세요." };
  }

  const { error } = await supabase
    .from("session_logs")
    .update({
      session_date: sessionDate,
      subject: subject || null,
      progress: progress || null,
      content,
    })
    .eq("id", logId);

  if (error) {
    return { error: "수정에 실패했습니다." };
  }

  refresh();

  return {};
}

export type EnrollmentActionState = { error?: string };

export async function enrollClass(
  menteeId: string,
  classId: string,
): Promise<EnrollmentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("class_enrollments").insert({
    mentee_id: menteeId,
    class_id: classId,
  });

  if (error) {
    return { error: "수강 등록에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function unenrollClass(
  enrollmentId: string,
): Promise<EnrollmentActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("class_enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    return { error: "수강 해제에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function deleteSessionLog(
  logId: string,
): Promise<SessionLogState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: existing } = await supabase
    .from("session_logs")
    .select("mentor_id")
    .eq("id", logId)
    .maybeSingle();

  if (!existing) {
    return { error: "일지를 찾을 수 없습니다." };
  }

  if (existing.mentor_id !== user.id) {
    return { error: "본인이 작성한 일지만 삭제할 수 있습니다." };
  }

  const { error } = await supabase
    .from("session_logs")
    .delete()
    .eq("id", logId);

  if (error) {
    return { error: "삭제에 실패했습니다." };
  }

  refresh();

  return {};
}
