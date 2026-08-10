"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NotebookPen, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import {
  labelClass,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/form";
import { deleteMentee, updateMenteeName } from "./actions";
import { NewMenteeForm } from "./new-mentee-form";

type Mentee = {
  id: string;
  name: string;
  school: string | null;
  grade: string | null;
};

function EditMenteeForm({
  mentee,
  onCancel,
  onSaved,
}: {
  mentee: Mentee;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateMenteeName(mentee.id, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor={`name-${mentee.id}`} className={labelClass}>
          학생 이름
        </label>
        <input
          id={`name-${mentee.id}`}
          name="name"
          type="text"
          required
          defaultValue={mentee.name}
          className={fieldClass}
        />
      </div>

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

function MenteeCard({
  mentee,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
  onDelete,
  deleting,
  deleteError,
  canDelete,
}: {
  mentee: Mentee;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDelete: () => void;
  deleting: boolean;
  deleteError?: string;
  canDelete: boolean;
}) {
  if (editing) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-soft">
        <EditMenteeForm mentee={mentee} onCancel={onCancelEdit} onSaved={onSaved} />
      </div>
    );
  }

  const subtitle = [mentee.school, mentee.grade].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
            {mentee.name[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-900">{mentee.name}</p>
            {subtitle && <p className="truncate text-xs text-stone-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label="이름 수정"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="삭제"
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}

      <Link
        href={`/mentees/${mentee.id}`}
        className={`mt-4 flex items-center justify-center gap-2 ${primaryButtonClass}`}
      >
        <NotebookPen className="h-4 w-4" aria-hidden />
        일지 작성
      </Link>
    </div>
  );
}

export function MenteeList({
  mentees,
  isAdmin,
}: {
  mentees: Mentee[];
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return mentees;
    return mentees.filter((mentee) => mentee.name.toLowerCase().includes(trimmed));
  }, [mentees, query]);

  async function handleDelete(mentee: Mentee) {
    if (
      !confirm(
        `"${mentee.name}" 학생을 삭제하시겠습니까?\n이 학생의 출석·일지·수강 기록도 함께 삭제됩니다.`,
      )
    ) {
      return;
    }
    setDeletingId(mentee.id);
    setDeleteError(null);
    const result = await deleteMentee(mentee.id);
    setDeletingId(null);
    if (result.error) {
      setDeleteError({ id: mentee.id, message: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
          aria-hidden
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름으로 검색"
          aria-label="학생 이름 검색"
          className={`${fieldClass} pl-10`}
        />
      </div>

      <p className="px-1 text-xs text-stone-500">
        {query.trim() ? `검색 결과 ${filtered.length}명` : `전체 ${mentees.length}명`}
      </p>

      {query.trim() && filtered.length === 0 ? (
        <p className="rounded-3xl border border-stone-200 bg-white px-6 py-10 text-center text-sm text-stone-500 shadow-soft">
          검색 결과가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mentee) => (
            <MenteeCard
              key={mentee.id}
              mentee={mentee}
              editing={editingId === mentee.id}
              onEdit={() => setEditingId(mentee.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
              onDelete={() => handleDelete(mentee)}
              deleting={deletingId === mentee.id}
              deleteError={deleteError?.id === mentee.id ? deleteError.message : undefined}
              canDelete={isAdmin}
            />
          ))}

          {addOpen ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                aria-label="닫기"
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
              <NewMenteeForm />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-stone-300 p-6 text-stone-500 hover:border-emerald-400 hover:bg-emerald-50/40 hover:text-emerald-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <UserPlus className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium">학생 추가</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
