"use server";

import { refresh, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CLASS_COLORS, type ClassColor } from "@/lib/class-colors";

export type ClassActionState = { error?: string };

function parseClassForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const dayOfWeek = Number(formData.get("day_of_week"));
  const teacherName = String(formData.get("teacher_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const colorInput = String(formData.get("color") ?? "");
  const color: ClassColor = (
    CLASS_COLORS as string[]
  ).includes(colorInput)
    ? (colorInput as ClassColor)
    : "rose";

  return { name, dayOfWeek, teacherName, description, color };
}

export async function createClass(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (mentor?.role !== "admin") {
    return { error: "관리자만 수업을 추가할 수 있습니다." };
  }

  const { name, dayOfWeek, teacherName, description, color } =
    parseClassForm(formData);

  if (!name || Number.isNaN(dayOfWeek)) {
    return { error: "수업 이름과 요일을 입력해주세요." };
  }

  const { error } = await supabase.from("classes").insert({
    name,
    day_of_week: dayOfWeek,
    teacher_name: teacherName || null,
    description: description || null,
    color,
  });

  if (error) {
    return { error: "수업 저장에 실패했습니다." };
  }

  revalidatePath("/classes");
  revalidatePath("/mentees");

  return {};
}

export async function updateClass(
  classId: string,
  formData: FormData,
): Promise<ClassActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (mentor?.role !== "admin") {
    return { error: "관리자만 수업을 수정할 수 있습니다." };
  }

  const { name, dayOfWeek, teacherName, description, color } =
    parseClassForm(formData);

  if (!name || Number.isNaN(dayOfWeek)) {
    return { error: "수업 이름과 요일을 입력해주세요." };
  }

  const { error } = await supabase
    .from("classes")
    .update({
      name,
      day_of_week: dayOfWeek,
      teacher_name: teacherName || null,
      description: description || null,
      color,
    })
    .eq("id", classId);

  if (error) {
    return { error: "수업 수정에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function deleteClass(
  classId: string,
): Promise<ClassActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (mentor?.role !== "admin") {
    return { error: "관리자만 수업을 삭제할 수 있습니다." };
  }

  const { error } = await supabase.from("classes").delete().eq("id", classId);

  if (error) {
    return { error: "수업 삭제에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function cancelClassOccurrence(
  classId: string,
  cancelledDate: string,
): Promise<ClassActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("class_cancellations").insert({
    class_id: classId,
    cancelled_date: cancelledDate,
  });

  if (error) {
    return { error: "휴강 처리에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function uncancelClassOccurrence(
  cancellationId: string,
): Promise<ClassActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("class_cancellations")
    .delete()
    .eq("id", cancellationId);

  if (error) {
    return { error: "휴강 해제에 실패했습니다." };
  }

  refresh();

  return {};
}
