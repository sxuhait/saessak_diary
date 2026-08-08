"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";
import { parseScheduleFormInput, serializeSchedule } from "@/lib/event-schedule";

export type EventType = Enums<"center_event_type">;

export type EventActionState = { error?: string };

export async function createEvent(
  _prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const eventType = String(formData.get("event_type") ?? "other") as EventType;
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "") || startDate;
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const schedule = serializeSchedule(
    parseScheduleFormInput(String(formData.get("schedule") ?? "")),
  );

  if (!title || !startDate) {
    return { error: "제목과 시작일을 입력해주세요." };
  }

  if (endDate < startDate) {
    return { error: "종료일은 시작일보다 빠를 수 없습니다." };
  }

  const { error } = await supabase.from("center_events").insert({
    title,
    event_type: eventType,
    start_date: startDate,
    end_date: endDate,
    location: location || null,
    description: description || null,
    schedule,
    created_by: user.id,
  });

  if (error) {
    return { error: "행사 저장에 실패했습니다." };
  }

  revalidatePath("/events");
  revalidatePath("/");

  return {};
}
