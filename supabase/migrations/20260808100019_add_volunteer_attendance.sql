-- Ad-hoc "오늘 참석합니다" check-in for volunteers, as opposed to mentors'
-- recurring weekly hours (mentor_schedules). One row per volunteer per day;
-- checking in/out is just insert/delete of that day's row. Fully shared
-- read (everyone can see today's headcount/roster), writes locked to the
-- checking-in volunteer and to the volunteer role (mirrors how
-- mentor_schedules insert/update is gated to role <> 'volunteer').

create table public.volunteer_attendance (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.mentors (id) on delete cascade,
  attendance_date date not null,
  created_at timestamptz not null default now(),
  unique (volunteer_id, attendance_date)
);

create index volunteer_attendance_date_idx on public.volunteer_attendance (attendance_date);

alter table public.volunteer_attendance enable row level security;

create policy "authenticated mentors can view volunteer attendance"
  on public.volunteer_attendance for select
  to authenticated
  using (not public.current_mentor_blocked());

create policy "volunteers can check in for themselves"
  on public.volunteer_attendance for insert
  to authenticated
  with check (
    volunteer_id = auth.uid()
    and not public.current_mentor_blocked()
    and public.current_mentor_role() = 'volunteer'
  );

create policy "volunteers can remove their own check-in"
  on public.volunteer_attendance for delete
  to authenticated
  using (volunteer_id = auth.uid() and not public.current_mentor_blocked());
