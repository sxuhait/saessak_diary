-- Lets a single session log record multiple subjects/progress lines in one
-- entry (e.g. "수학 45~52p" + "영어 단어 20개" in the same 일지) instead of
-- being pinned to exactly one subject. Mirrors the class_days precedent
-- (20260812100000): a child table normalizes the one-to-many relationship,
-- existing single subject/progress values get backfilled into it as row 0,
-- then the now-redundant session_logs.subject/progress columns are dropped
-- so there's a single source of truth going forward.
--
-- Also drops the session_logs.content NOT NULL constraint -- a log can now
-- be just subject/progress lines with no narrative content.

create table public.session_log_subjects (
  id uuid primary key default gen_random_uuid(),
  session_log_id uuid not null references public.session_logs (id) on delete cascade,
  subject text not null,
  progress text,
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index session_log_subjects_session_log_id_idx on public.session_log_subjects (session_log_id);
create index session_log_subjects_subject_idx on public.session_log_subjects (subject);

alter table public.session_log_subjects enable row level security;

-- Matches session_logs' own select policy (20260806130000): subject/progress
-- lines are a direct extension of a log's content, not lower-sensitivity
-- shared schedule data like class_days, so they're gated by the same
-- blocked check rather than a flat using (true).
create policy "authenticated mentors can view session log subjects"
  on public.session_log_subjects for select
  to authenticated
  using (not public.current_mentor_blocked());

-- Owner-scoped through the parent session_log, same shape as the
-- 20260810120000 owner-only update/delete restriction on session_logs
-- itself: a mentor can only attach/remove subject rows on a log they wrote.
create policy "mentors can insert subjects for their own session logs"
  on public.session_log_subjects for insert
  to authenticated
  with check (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.session_logs sl
      where sl.id = session_log_subjects.session_log_id
        and sl.mentor_id = auth.uid()
    )
  );

create policy "mentors can delete subjects for their own session logs"
  on public.session_log_subjects for delete
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.session_logs sl
      where sl.id = session_log_subjects.session_log_id
        and sl.mentor_id = auth.uid()
    )
  );

-- Backfill: every existing log's single subject/progress becomes row 0 of
-- its subject list. Logs with no subject stay with zero subject rows.
insert into public.session_log_subjects (session_log_id, subject, progress, position)
select id, subject, progress, 0
from public.session_logs
where subject is not null and subject <> '';

alter table public.session_logs drop column subject;
alter table public.session_logs drop column progress;
alter table public.session_logs alter column content drop not null;
