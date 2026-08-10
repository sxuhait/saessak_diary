"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "../actions";
import {
  isValidTimeValue,
  parseScheduleFormInput,
  serializeSchedule,
} from "@/lib/event-schedule";

export type EventActionState = { error?: string };

export type PhotoActionState = { error?: string };

const PHOTO_BUCKET = "event-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

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
  const scheduleItems = parseScheduleFormInput(
    String(formData.get("schedule") ?? ""),
  );

  if (!title || !startDate) {
    return { error: "제목과 시작일을 입력해주세요." };
  }

  if (endDate < startDate) {
    return { error: "종료일은 시작일보다 빠를 수 없습니다." };
  }

  if (scheduleItems.some((item) => !isValidTimeValue(item.time))) {
    return {
      error: "일정 시간은 24시간 형식(HH:MM)으로 입력해주세요. 예: 14:00",
    };
  }

  const schedule = serializeSchedule(scheduleItems);

  const { error } = await supabase
    .from("center_events")
    .update({
      title,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate,
      location: location || null,
      description: description || null,
      schedule,
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

export async function deleteEvent(eventId: string): Promise<EventActionState> {
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
    return { error: "관리자만 행사를 삭제할 수 있습니다." };
  }

  const { error } = await supabase.from("center_events").delete().eq("id", eventId);

  if (error) {
    return { error: "행사 삭제에 실패했습니다." };
  }

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

export async function uploadEventPhotos(
  eventId: string,
  formData: FormData,
): Promise<PhotoActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return { error: "업로드할 사진을 선택해주세요." };
  }

  for (const file of files) {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      return { error: "이미지 파일(JPG, PNG, WEBP, GIF)만 업로드할 수 있습니다." };
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: "파일 용량은 사진 한 장당 5MB 이하만 업로드할 수 있습니다." };
    }
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from("center_events")
    .select("photo_urls")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !existingEvent) {
    return { error: "행사를 찾을 수 없습니다." };
  }

  const uploadedPaths: string[] = [];
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${eventId}/${randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
      }
      return { error: "사진 업로드에 실패했습니다." };
    }

    uploadedPaths.push(path);
    const {
      data: { publicUrl },
    } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    uploadedUrls.push(publicUrl);
  }

  const { error: updateError } = await supabase
    .from("center_events")
    .update({ photo_urls: [...existingEvent.photo_urls, ...uploadedUrls] })
    .eq("id", eventId);

  if (updateError) {
    await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
    return { error: "사진 정보를 저장하지 못했습니다." };
  }

  revalidatePath(`/events/${eventId}`);

  return {};
}

export async function deleteEventPhoto(
  eventId: string,
  photoUrl: string,
): Promise<PhotoActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from("center_events")
    .select("photo_urls")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !existingEvent) {
    return { error: "행사를 찾을 수 없습니다." };
  }

  const marker = `/object/public/${PHOTO_BUCKET}/`;
  const markerIndex = photoUrl.indexOf(marker);
  const path =
    markerIndex >= 0 ? photoUrl.slice(markerIndex + marker.length) : null;

  if (path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  }

  const { error: updateError } = await supabase
    .from("center_events")
    .update({
      photo_urls: existingEvent.photo_urls.filter((url) => url !== photoUrl),
    })
    .eq("id", eventId);

  if (updateError) {
    return { error: "사진 삭제에 실패했습니다." };
  }

  revalidatePath(`/events/${eventId}`);

  return {};
}
