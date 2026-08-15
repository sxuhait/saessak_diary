"use client";

import { useState } from "react";
import { Sprout, Star, X } from "lucide-react";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/form";
import { submitFeedback, type FeedbackUsefulFeature } from "@/app/feedback/actions";

const RATING_VALUES = [1, 2, 3, 4, 5];

const USEFUL_FEATURE_OPTIONS: { value: FeedbackUsefulFeature; label: string }[] = [
  { value: "session_log", label: "일지 작성" },
  { value: "diagnostics", label: "학습 진단" },
  { value: "attendance", label: "출석 체크" },
  { value: "schedule", label: "시간표" },
  { value: "other", label: "기타" },
];

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-stone-300 text-stone-600 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}

export function FeedbackModal({
  open,
  onClose,
  title = "피드백 남기기",
  description = "새싹일기를 더 좋게 만드는 데 큰 도움이 됩니다.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [usefulFeature, setUsefulFeature] = useState<FeedbackUsefulFeature | null>(null);
  const [painPoint, setPainPoint] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  // Modal instance stays mounted across open/close (parent just toggles
  // `open`), so every dismissal path resets state -- otherwise reopening
  // would flash the previous submission's "감사합니다" screen.
  function handleClose() {
    onClose();
    setRating(0);
    setHoverRating(0);
    setComment("");
    setUsefulFeature(null);
    setPainPoint("");
    setError(null);
    setSubmitted(false);
    setPending(false);
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError("별점을 선택해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await submitFeedback({
      rating,
      comment,
      usefulFeature,
      painPoint,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Sprout className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-base font-semibold text-stone-900">
              감사합니다!
            </p>
            <p className="text-sm text-stone-500">
              소중한 의견이 잘 전달됐어요.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className={`mt-2 ${primaryButtonClass}`}
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-stone-500">{description}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="닫기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-5 flex justify-center gap-1">
              {RATING_VALUES.map((value) => {
                const filled = value <= (hoverRating || rating);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`별점 ${value}점`}
                    aria-pressed={rating === value}
                    className="p-1"
                  >
                    <Star
                      className={`h-8 w-8 ${filled ? "text-emerald-500" : "text-stone-300"}`}
                      fill={filled ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-stone-500">
                가장 유용했던 기능 (선택)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {USEFUL_FEATURE_OPTIONS.map((option) => (
                  <ChipButton
                    key={option.value}
                    label={option.label}
                    active={usefulFeature === option.value}
                    onClick={() =>
                      setUsefulFeature((current) =>
                        current === option.value ? null : option.value,
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="자유롭게 의견을 남겨주세요 (선택)"
              aria-label="의견"
              className={`mt-4 ${fieldClass}`}
            />

            <input
              type="text"
              value={painPoint}
              onChange={(e) => setPainPoint(e.target.value)}
              placeholder="불편했거나 아쉬웠던 점 (선택)"
              aria-label="불편했거나 아쉬웠던 점"
              className={`mt-3 ${fieldClass}`}
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className={secondaryButtonClass}
              >
                나중에
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className={primaryButtonClass}
              >
                {pending ? "제출 중..." : "제출"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
