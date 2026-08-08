"use client";

import { useState } from "react";
import { DatePicker } from "@/components/date-picker";
import { COMMON_SUBJECTS } from "@/lib/subjects";
import {
  labelClass,
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
  textActionClass,
  textDangerActionClass,
} from "@/components/ui/form";
import { deleteSessionLog, updateSessionLog } from "./actions";

type SessionLog = {
  id: string;
  session_date: string;
  subject: string | null;
  progress: string | null;
  content: string;
  authorName: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatSessionDate(sessionDate: string) {
  // session_date is a plain "YYYY-MM-DD" date column; parse as local, not UTC,
  // so it doesn't shift a day depending on the server's timezone.
  const [year, month, day] = sessionDate.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

function EditLogForm({
  log,
  onCancel,
  onSaved,
}: {
  log: SessionLog;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateSessionLog(log.id, formData);
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
        <label className={labelClass}>수업 날짜</label>
        <DatePicker name="session_date" defaultValue={log.session_date} />
      </div>

      <div>
        <label htmlFor={`subject-${log.id}`} className={labelClass}>
          과목 (선택)
        </label>
        <input
          id={`subject-${log.id}`}
          name="subject"
          type="text"
          list={`subject-options-${log.id}`}
          defaultValue={log.subject ?? ""}
          className={fieldClass}
        />
        <datalist id={`subject-options-${log.id}`}>
          {COMMON_SUBJECTS.map((subject) => (
            <option key={subject} value={subject} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor={`progress-${log.id}`} className={labelClass}>
          진도 (선택)
        </label>
        <input
          id={`progress-${log.id}`}
          name="progress"
          type="text"
          defaultValue={log.progress ?? ""}
          placeholder="예: 문제집 45~52p, 3단원"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor={`content-${log.id}`} className={labelClass}>
          일지 내용
        </label>
        <textarea
          id={`content-${log.id}`}
          name="content"
          required
          rows={5}
          defaultValue={log.content}
          className={fieldClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={secondaryButtonClass}
        >
          취소
        </button>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}

export function SessionLogList({ logs }: { logs: SessionLog[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  async function handleDelete(log: SessionLog) {
    if (!confirm("이 일지를 삭제하시겠습니까?")) return;
    setDeletingId(log.id);
    setDeleteError(null);
    const result = await deleteSessionLog(log.id);
    setDeletingId(null);
    if (result.error) {
      setDeleteError({ id: log.id, message: result.error });
    }
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-stone-500">아직 작성된 일지가 없습니다.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {logs.map((log) =>
        editingId === log.id ? (
          <li key={log.id}>
            <EditLogForm
              log={log}
              onCancel={() => setEditingId(null)}
              onSaved={() => setEditingId(null)}
            />
          </li>
        ) : (
          <li
            key={log.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-stone-900">
                {formatSessionDate(log.session_date)}
              </span>
              {log.subject && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  {log.subject}
                </span>
              )}
            </div>
            {log.authorName && (
              <p className="mt-0.5 text-xs text-stone-500">
                작성 멘토: {log.authorName}
              </p>
            )}
            {log.progress && (
              <p className="mt-2 text-xs text-stone-500">
                진도: {log.progress}
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
              {log.content}
            </p>

            <div className="mt-3 flex items-center gap-4 border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingId(log.id)}
                className={textActionClass}
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => handleDelete(log)}
                disabled={deletingId === log.id}
                className={textDangerActionClass}
              >
                {deletingId === log.id ? "삭제 중..." : "삭제"}
              </button>
              {deleteError?.id === log.id && (
                <span className="text-xs text-red-600">
                  {deleteError.message}
                </span>
              )}
            </div>
          </li>
        ),
      )}
    </ul>
  );
}
