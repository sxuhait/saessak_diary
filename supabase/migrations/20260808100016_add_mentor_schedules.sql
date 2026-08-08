-- Mentor's own recurring weekly attendance hours (e.g. "월 14:00~18:00,
-- 수 15:00~19:00"). Each row is one day/time-range slot; a mentor can have
-- several. Fully shared read (everyone sees who's in on which day/time,
-- same model as classes/center_events), but writes are locked to the
-- owning mentor. day_of_week uses the same 0=Sunday..6=Saturday convention
-- as classes.day_of_week (src/lib/weekday.ts).
--
-- Volunteers register a day's presence differently (ad-hoc "오늘 참석" check,
-- see volunteer_attendance) rather than a recurring schedule, so insert/
-- update require current_mentor_role() <> 'volunteer' -- mirrors how
-- classes insert/update/delete is gated to role = 'admin'.

create table public.mentor_schedules (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint mentor_schedules_time_range_check check (end_time > start_time)
);

create index mentor_schedules_mentor_id_idx on public.mentor_schedules (mentor_id);
create index mentor_schedules_day_of_week_idx on public.mentor_schedules (day_of_week);

alter table public.mentor_schedules enable row level security;

create policy "authenticated mentors can view mentor schedules"
  on public.mentor_schedules for select
  to authenticated
  using (not public.current_mentor_blocked());

create policy "mentors can insert their own schedule"
  on public.mentor_schedules for insert
  to authenticated
  with check (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and public.current_mentor_role() <> 'volunteer'
  );

create policy "mentors can update their own schedule"
  on public.mentor_schedules for update
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked())
  with check (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and public.current_mentor_role() <> 'volunteer'
  );

create policy "mentors can delete their own schedule"
  on public.mentor_schedules for delete
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked());
