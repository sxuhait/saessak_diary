"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";

export type AttendanceStatus = Enums<"attendance_status">;

export type AttendanceActionState = { error?: string };

export async function setAttendance(
  menteeId: string,
  sessionDate: string,
  status: AttendanceStatus,
  reason: string | null,
): Promise<AttendanceActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase.from("attendance").upsert(
    {
      mentee_id: menteeId,
      mentor_id: user.id,
      session_date: sessionDate,
      status,
      reason:
        status === "excused" || status === "late"
          ? (reason?.trim() ?? null) || null
          : null,
    },
    { onConflict: "mentee_id,session_date" },
  );

  if (error) {
    return { error: "출석 저장에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  refresh();

  return {};
}

export async function clearAttendance(
  menteeId: string,
  sessionDate: string,
): Promise<AttendanceActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("mentee_id", menteeId)
    .eq("session_date", sessionDate);

  if (error) {
    return { error: "출석 기록 삭제에 실패했습니다." };
  }

  refresh();

  return {};
}
