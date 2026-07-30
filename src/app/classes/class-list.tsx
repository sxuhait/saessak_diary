"use client";

import { useState } from "react";
import { DAY_LABELS } from "@/lib/weekday";
import { ColorPicker } from "@/components/color-picker";
import { CLASS_COLOR_DOT_CLASS, type ClassColor } from "@/lib/class-colors";
import { deleteClass, updateClass } from "./actions";

type ClassItem = {
  id: string;
  name: string;
  day_of_week: number;
  teacher_name: string | null;
  description: string | null;
  color: ClassColor;
};

function EditClassForm({
  item,
  onCancel,
  onSaved,
}: {
  item: ClassItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateClass(item.id, formData);
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
      className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4"
    >
      <div className="space-y-1">
        <label
          htmlFor={`name-${item.id}`}
          className="text-sm font-medium text-stone-700"
        >
          수업 이름
        </label>
        <input
          id={`name-${item.id}`}
          name="name"
          type="text"
          required
          defaultValue={item.name}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`day-${item.id}`}
          className="text-sm font-medium text-stone-700"
        >
          요일
        </label>
        <select
          id={`day-${item.id}`}
          name="day_of_week"
          defaultValue={item.day_of_week}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {DAY_LABELS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-stone-700">색</label>
        <ColorPicker name="color" defaultValue={item.color} />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`teacher-${item.id}`}
          className="text-sm font-medium text-stone-700"
        >
          선생님 (선택)
        </label>
        <input
          id={`teacher-${item.id}`}
          name="teacher_name"
          type="text"
          defaultValue={item.teacher_name ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`description-${item.id}`}
          className="text-sm font-medium text-stone-700"
        >
          설명 (선택)
        </label>
        <textarea
          id={`description-${item.id}`}
          name="description"
          rows={2}
          defaultValue={item.description ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-fit rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}

export function ClassList({ classes }: { classes: ClassItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  async function handleDelete(item: ClassItem) {
    if (!confirm(`"${item.name}" 수업을 삭제하시겠습니까?`)) return;
    setDeletingId(item.id);
    setDeleteError(null);
    const result = await deleteClass(item.id);
    setDeletingId(null);
    if (result.error) {
      setDeleteError({ id: item.id, message: result.error });
    }
  }

  if (classes.length === 0) {
    return <p className="text-sm text-stone-500">등록된 수업이 없습니다.</p>;
  }

  const byDay = DAY_LABELS.map((label, dayOfWeek) => ({
    dayOfWeek,
    label,
    items: classes.filter((item) => item.day_of_week === dayOfWeek),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {byDay.map((group) => (
        <div key={group.dayOfWeek}>
          <h3 className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium text-stone-900">
            {group.label}
            <span className="text-stone-400">—</span>
            {group.items.map((item, index) => (
              <span key={item.id} className="flex items-center gap-1 font-normal text-stone-500">
                <span
                  className={`h-2 w-2 rounded-full ${CLASS_COLOR_DOT_CLASS[item.color]}`}
                />
                {item.name}
                {index < group.items.length - 1 && ","}
              </span>
            ))}
          </h3>

          <ul className="mt-2 flex flex-col gap-2">
            {group.items.map((item) =>
              editingId === item.id ? (
                <li key={item.id}>
                  <EditClassForm
                    item={item}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={item.id}
                  className="rounded-lg border border-stone-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-stone-900">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${CLASS_COLOR_DOT_CLASS[item.color]}`}
                      />
                      {item.name}
                    </span>
                    {item.teacher_name && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                        {item.teacher_name} 선생님
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="rounded-md border border-emerald-600 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
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
