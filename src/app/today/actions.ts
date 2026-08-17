"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidTimeValue } from "@/lib/time-format";

export type TodayActionState = { error?: string };

function todayISODate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function addMentorSchedule(
  _prevState: TodayActionState,
  formData: FormData,
): Promise<TodayActionState> {
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

  if (mentor?.role === "volunteer") {
    return { error: "출근 스케줄은 멘토·관리자만 등록할 수 있습니다." };
  }

  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  if (Number.isNaN(dayOfWeek) || !startTime || !endTime) {
    return { error: "요일과 시간을 입력해주세요." };
  }

  if (!isValidTimeValue(startTime) || !isValidTimeValue(endTime)) {
    return { error: "시간은 24시간 형식(HH:MM)으로 입력해주세요." };
  }

  if (endTime <= startTime) {
    return { error: "종료 시간은 시작 시간보다 늦어야 합니다." };
  }

  const { error } = await supabase.from("mentor_schedules").insert({
    mentor_id: user.id,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) {
    return { error: "스케줄 저장에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function deleteMentorSchedule(
  scheduleId: string,
): Promise<TodayActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("mentor_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("mentor_id", user.id);

  if (error) {
    return { error: "스케줄 삭제에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function checkInToday(): Promise<TodayActionState> {
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

  if (mentor?.role !== "volunteer") {
    return { error: "오늘 참석 체크는 봉사자만 할 수 있습니다." };
  }

  const { error } = await supabase.from("volunteer_attendance").insert({
    volunteer_id: user.id,
    attendance_date: todayISODate(),
  });

  if (error) {
    return { error: "참석 체크에 실패했습니다." };
  }

  refresh();

  return {};
}

export async function checkOutToday(): Promise<TodayActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("volunteer_attendance")
    .delete()
    .eq("volunteer_id", user.id)
    .eq("attendance_date", todayISODate());

  if (error) {
    return { error: "참석 취소에 실패했습니다." };
  }

  refresh();

  return {};
}
