"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "../actions";

export type EventActionState = { error?: string };

export async function updateEvent(
  eventId: string,
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
  const schedule = String(formData.get("schedule") ?? "").trim();

  if (!title || !startDate) {
    return { error: "제목과 시작일을 입력해주세요." };
  }

  if (endDate < startDate) {
    return { error: "종료일은 시작일보다 빠를 수 없습니다." };
  }

  const { error } = await supabase
    .from("center_events")
    .update({
      title,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate,
      location: location || null,
      description: description || null,
      schedule: schedule || null,
    })
    .eq("id", eventId);

  if (error) {
    return { error: "행사 수정에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/");

  return {};
}

export async function deleteEvent(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("center_events").delete().eq("id", eventId);

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}
