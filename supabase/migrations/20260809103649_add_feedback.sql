-- In-app feedback box (replaces an external Google Form): a required star
-- rating (1-5) + optional free-text comment, attributed to the submitting
-- mentor. Write-only for everyone but admins -- mentors/volunteers submit
-- blind and can't browse what anyone (including themselves) wrote; only
-- admins can list it, from /feedback. No update/delete policy on purpose --
-- once submitted, feedback is meant to be immutable, like a real box.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;

create policy "authenticated mentors can submit feedback"
  on public.feedback for insert
  to authenticated
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "admins can view feedback"
  on public.feedback for select
  to authenticated
  using (public.current_mentor_role() = 'admin');
