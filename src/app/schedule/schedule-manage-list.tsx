"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/weekday";
import { CLASS_COLOR_DOT_CLASS, type ClassColor } from "@/lib/class-colors";
import {
  primaryButtonClass,
  secondaryButtonClass,
  textActionClass,
  textDangerActionClass,
} from "@/components/ui/form";
import { deleteScheduleItem, updateScheduleItem } from "./actions";
import { ScheduleItemFields } from "./schedule-item-fields";

export type ScheduleItem = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  subtitle: string | null;
  color: ClassColor;
};

const WEEKDAYS = [1, 2, 3, 4, 5]; // 월~금

function formatTime(value: string) {
  return value.slice(0, 5);
}

function EditItemForm({
  item,
  onCancel,
  onSaved,
}: {
  item: ScheduleItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateScheduleItem(item.id, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5"
    >
      <ScheduleItemFields
        idPrefix={`edit-${item.id}`}
        defaultValues={{
          day_of_week: item.day_of_week,
          start_time: formatTime(item.start_time),
          end_time: formatTime(item.end_time),
          title: item.title,
          subtitle: item.subtitle ?? "",
          color: item.color,
        }}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          취소
        </button>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

export function ScheduleManageList({
  items,
  isAdmin,
}: {
  items: ScheduleItem[];
  isAdmin: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  async function handleDelete(item: ScheduleItem) {
    if (!confirm(`"${item.title}" 항목을 삭제하시겠습니까?`)) return;
    setDeletingId(item.id);
    setDeleteError(null);
    const result = await deleteScheduleItem(item.id);
    setDeletingId(null);
    if (result.error) {
      setDeleteError({ id: item.id, message: result.error });
    }
  }

  if (!isAdmin) return null;

  const byDay = WEEKDAYS.map((day) => ({
    day,
    items: items
      .filter((item) => item.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-stone-900">항목 관리</h2>

      {byDay.map((group) => (
        <div key={group.day}>
          <h3 className="text-base font-semibold text-stone-900">
            {DAY_LABELS[group.day]}
          </h3>

          <ul className="mt-3 flex flex-col gap-3">
            {group.items.map((item) =>
              editingId === item.id ? (
                <li key={item.id}>
                  <EditItemForm
                    item={item}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={item.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-stone-900">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${CLASS_COLOR_DOT_CLASS[item.color]}`}
                      />
                      {formatTime(item.start_time)}~{formatTime(item.end_time)} ·{" "}
                      {item.title}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p className="mt-1 text-xs text-stone-500">{item.subtitle}</p>
                  )}

                  <div className="mt-3 flex items-center gap-4 border-t border-stone-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className={textActionClass}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className={textDangerActionClass}
                    >
                      {deletingId === item.id ? "삭제 중..." : "삭제"}
                    </button>
                    {deleteError?.id === item.id && (
                      <span className="text-xs text-red-600">
                        {deleteError.message}
                      </span>
                    )}
                  </div>
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
