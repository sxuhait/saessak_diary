"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CLASS_COLORS, type ClassColor } from "@/lib/class-colors";

export type ScheduleItemActionState = { error?: string };

function parseScheduleItemForm(formData: FormData) {
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const colorInput = String(formData.get("color") ?? "");
  const color: ClassColor = (CLASS_COLORS as string[]).includes(colorInput)
    ? (colorInput as ClassColor)
    : "sky";

  return { dayOfWeek, startTime, endTime, title, subtitle, color };
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "로그인이 필요합니다." } as const;
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (mentor?.role !== "admin") {
    return { supabase, error: "관리자만 시간표를 수정할 수 있습니다." } as const;
  }

  return { supabase, error: null } as const;
}

export async function createScheduleItem(
  _prevState: ScheduleItemActionState,
  formData: FormData,
): Promise<ScheduleItemActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { dayOfWeek, startTime, endTime, title, subtitle, color } =
    parseScheduleItemForm(formData);

  if (Number.isNaN(dayOfWeek) || !startTime || !endTime || !title) {
    return { error: "요일, 시간, 프로그램명을 입력해주세요." };
  }

  if (endTime <= startTime) {
    return { error: "종료 시간은 시작 시간보다 늦어야 합니다." };
  }

  const { error } = await supabase.from("schedule_items").insert({
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    title,
    subtitle: subtitle || null,
    color,
  });

  if (error) {
    return { error: "시간표 항목 저장에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function updateScheduleItem(
  itemId: string,
  formData: FormData,
): Promise<ScheduleItemActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { dayOfWeek, startTime, endTime, title, subtitle, color } =
    parseScheduleItemForm(formData);

  if (Number.isNaN(dayOfWeek) || !startTime || !endTime || !title) {
    return { error: "요일, 시간, 프로그램명을 입력해주세요." };
  }

  if (endTime <= startTime) {
    return { error: "종료 시간은 시작 시간보다 늦어야 합니다." };
  }

  const { error } = await supabase
    .from("schedule_items")
    .update({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      title,
      subtitle: subtitle || null,
      color,
    })
    .eq("id", itemId);

  if (error) {
    return { error: "시간표 항목 수정에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function deleteScheduleItem(
  itemId: string,
): Promise<ScheduleItemActionState> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("schedule_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return { error: "시간표 항목 삭제에 실패했습니다." };
  }

  refresh();

  return {};
}
