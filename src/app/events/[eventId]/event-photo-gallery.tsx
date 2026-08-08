"use client";

import { useRef, useState } from "react";
import { cardClassName } from "@/components/ui/card";
import { secondaryPillClass } from "@/components/ui/form";
import { deleteEventPhoto, uploadEventPhotos } from "./actions";

const MAX_PHOTO_MB = 5;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function EventPhotoGallery({
  eventId,
  photoUrls,
  variant = "card",
}: {
  eventId: string;
  photoUrls: string[];
  /** "card" wraps the section in its own white card (edit mode, standalone
   * use); "inline" renders bare so it can sit inside a parent card's own
   * padding (the read-only detail view). */
  variant?: "card" | "inline";
}) {
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setError(null);

    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        setError("이미지 파일(JPG, PNG, WEBP, GIF)만 업로드할 수 있습니다.");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        setError(`파일 용량은 사진 한 장당 ${MAX_PHOTO_MB}MB 이하만 업로드할 수 있습니다.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));

    setUploading(true);
    const result = await uploadEventPhotos(eventId, formData);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result?.error) {
      setError(result.error);
    }
  }

  async function handleDelete(url: string) {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;

    setError(null);
    setDeletingUrl(url);
    const result = await deleteEventPhoto(eventId, url);
    setDeletingUrl(null);

    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div
      className={`flex flex-col gap-4 ${variant === "card" ? cardClassName : ""}`}
    >
      <h3 className="text-sm font-medium text-stone-500">사진</h3>

      {photoUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photoUrls.map((url) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="행사 사진"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(url)}
                disabled={deletingUrl === url}
                aria-label="사진 삭제"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-stone-500"
              >
                {deletingUrl === url ? "…" : "×"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFilesSelected}
          className="hidden"
          id={`photo-upload-${eventId}`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${secondaryPillClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {uploading ? "업로드 중..." : "사진 추가"}
        </button>
        <p className="mt-1.5 text-xs text-stone-400">
          이미지 파일만, 사진 한 장당 {MAX_PHOTO_MB}MB 이하
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
