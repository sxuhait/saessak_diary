"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  labelClass,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textActionClass,
  textDangerActionClass,
} from "@/components/ui/form";
import { deleteMentee, updateMenteeName } from "./actions";

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
    <form
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5"
    >
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
          className={`${fieldClass} bg-white`}
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

export function MenteeList({ mentees }: { mentees: Mentee[] }) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return mentees;
    return mentees.filter((mentee) =>
      mentee.name.toLowerCase().includes(trimmed),
    );
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
    <div className="flex flex-col gap-3">
      <div className="relative">
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

      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-stone-500">
            검색 결과가 없습니다.
          </p>
        ) : (
          <ul className="flex max-h-[32rem] flex-col divide-y divide-stone-100 overflow-y-auto">
            {filtered.map((mentee) => (
              <li key={mentee.id}>
                {editingId === mentee.id ? (
                  <div className="p-4 sm:p-6">
                    <EditMenteeForm
                      mentee={mentee}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-4 hover:bg-emerald-50 sm:px-6">
                    <Link
                      href={`/mentees/${mentee.id}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3"
                    >
                      <span className="truncate font-medium text-stone-900">
                        {mentee.name}
                      </span>
                      <span className="shrink-0 text-sm text-stone-500">
                        {[mentee.school, mentee.grade]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3 pl-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(mentee.id)}
                        className={textActionClass}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mentee)}
                        disabled={deletingId === mentee.id}
                        className={textDangerActionClass}
                      >
                        {deletingId === mentee.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                )}
                {deleteError?.id === mentee.id && (
                  <p className="px-4 pb-3 text-xs text-red-600 sm:px-6">
                    {deleteError.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
