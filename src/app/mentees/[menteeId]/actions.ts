"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionLogState = { error?: string };

// SubjectRowsEditor submits each row as a parallel name="subject"/
// name="progress" pair (paired by index in the form), rather than a single
// value -- zip them back together here and drop any row with a blank
// subject (a progress note without a subject label has nothing to attach
// to).
function parseSubjectRows(formData: FormData): { subject: string; progress: string }[] {
  const subjects = formData.getAll("subject").map((value) => String(value).trim());
  const progresses = formData.getAll("progress").map((value) => String(value).trim());
  const rows: { subject: string; progress: string }[] = [];
  for (let i = 0; i < subjects.length; i++) {
    if (!subjects[i]) continue;
    rows.push({ subject: subjects[i], progress: progresses[i] ?? "" });
  }
  return rows;
}

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
  const content = String(formData.get("content") ?? "").trim();
  const subjectRows = parseSubjectRows(formData);

  if (!sessionDate) {
    return { error: "날짜를 입력해주세요." };
  }

  const { data: newLog, error } = await supabase
    .from("session_logs")
    .insert({
      mentee_id: menteeId,
      mentor_id: user.id,
      session_date: sessionDate,
      content: content || null,
    })
    .select("id")
    .single();

  if (error || !newLog) {
    return { error: "저장에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  if (subjectRows.length > 0) {
    const { error: subjectsError } = await supabase.from("session_log_subjects").insert(
      subjectRows.map((row, index) => ({
        session_log_id: newLog.id,
        subject: row.subject,
        progress: row.progress || null,
        position: index,
      })),
    );

    if (subjectsError) {
      // Roll back the orphaned log rather than leaving one behind with no
      // subjects, matching the createClass/class_days rollback pattern.
      await supabase.from("session_logs").delete().eq("id", newLog.id);
      return { error: "과목 저장에 실패했습니다." };
    }
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
  const content = String(formData.get("content") ?? "").trim();
  const subjectRows = parseSubjectRows(formData);

  if (!sessionDate) {
    return { error: "날짜를 입력해주세요." };
  }

  const { error } = await supabase
    .from("session_logs")
    .update({
      session_date: sessionDate,
      content: content || null,
    })
    .eq("id", logId);

  if (error) {
    return { error: "수정에 실패했습니다." };
  }

  // Simplest way to reconcile the subject set: drop everything and
  // reinsert, rather than diffing against what's currently stored --
  // matches updateClass/class_days.
  const { error: deleteSubjectsError } = await supabase
    .from("session_log_subjects")
    .delete()
    .eq("session_log_id", logId);

  if (deleteSubjectsError) {
    return { error: "과목 수정에 실패했습니다." };
  }

  if (subjectRows.length > 0) {
    const { error: insertSubjectsError } = await supabase.from("session_log_subjects").insert(
      subjectRows.map((row, index) => ({
        session_log_id: logId,
        subject: row.subject,
        progress: row.progress || null,
        position: index,
      })),
    );

    if (insertSubjectsError) {
      return { error: "과목 수정에 실패했습니다." };
    }
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
