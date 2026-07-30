-- Center classes (외부 강사가 진행하는 연극/영어/미술/독서 수업 등), shared
-- across all mentors like center_events -- NOT scoped per mentor. Every
-- authenticated mentor can view, add, edit, and delete these.
--
-- class_enrollments (many-to-many mentee <-> class) IS mentor-scoped, same
-- pattern as attendance/session_logs: a mentor can only see/manage
-- enrollments for mentees assigned to them via weekday_registrations.

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  teacher_name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_day_of_week_idx on public.classes (day_of_week);

alter table public.classes enable row level security;

create policy "authenticated mentors can view classes"
  on public.classes for select
  to authenticated
  using (true);

create policy "authenticated mentors can insert classes"
  on public.classes for insert
  to authenticated
  with check (true);

create policy "authenticated mentors can update classes"
  on public.classes for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated mentors can delete classes"
  on public.classes for delete
  to authenticated
  using (true);

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
create table public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.mentees (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (mentee_id, class_id)
);

create index class_enrollments_mentee_id_idx on public.class_enrollments (mentee_id);
create index class_enrollments_class_id_idx on public.class_enrollments (class_id);

alter table public.class_enrollments enable row level security;

create policy "mentors can view enrollments for their mentees"
  on public.class_enrollments for select
  to authenticated
  using (
    exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = class_enrollments.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can enroll their mentees in classes"
  on public.class_enrollments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = class_enrollments.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can unenroll their mentees from classes"
  on public.class_enrollments for delete
  to authenticated
  using (
    exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = class_enrollments.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );
