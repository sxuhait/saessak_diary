-- saessak_diary phase 1 schema
-- Entities: mentor, mentee, weekday_registration, attendance, session_log
--
-- RLS model (phase 1, small trusted community-center staff):
--   - mentees, weekday_registrations: shared roster, full CRUD for any
--     authenticated mentor (staff share visibility over the kids).
--   - attendance, session_logs: readable by any authenticated mentor, but
--     writes are pinned to the acting mentor (mentor_id = auth.uid()) so
--     there is an audit trail of who logged what.
-- Revisit if the center grows to multiple independent branches.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- mentor: profile row mirroring auth.users, one per signed-up mentor
-- ---------------------------------------------------------------------
create table public.mentors (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.mentors enable row level security;

create policy "mentors can view their own profile"
  on public.mentors for select
  to authenticated
  using (id = auth.uid());

create policy "mentors can update their own profile"
  on public.mentors for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- auto-create a mentor profile row whenever a new auth user signs up
create function public.handle_new_mentor()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.mentors (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_mentor();

-- ---------------------------------------------------------------------
-- mentee: the child being mentored
-- ---------------------------------------------------------------------
create table public.mentees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date,
  school text,
  grade text,
  guardian_contact text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.mentees enable row level security;

create policy "authenticated mentors can view mentees"
  on public.mentees for select
  to authenticated
  using (true);

create policy "authenticated mentors can insert mentees"
  on public.mentees for insert
  to authenticated
  with check (true);

create policy "authenticated mentors can update mentees"
  on public.mentees for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- weekday_registration: recurring weekly schedule assigning a mentee to
-- a mentor on a given day of week (0 = Sunday .. 6 = Saturday)
-- ---------------------------------------------------------------------
create table public.weekday_registrations (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.mentees (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  created_at timestamptz not null default now(),
  unique (mentee_id, mentor_id, day_of_week)
);

create index weekday_registrations_mentee_id_idx on public.weekday_registrations (mentee_id);
create index weekday_registrations_mentor_id_idx on public.weekday_registrations (mentor_id);

alter table public.weekday_registrations enable row level security;

create policy "authenticated mentors can view weekday registrations"
  on public.weekday_registrations for select
  to authenticated
  using (true);

create policy "authenticated mentors can insert weekday registrations"
  on public.weekday_registrations for insert
  to authenticated
  with check (true);

create policy "authenticated mentors can update weekday registrations"
  on public.weekday_registrations for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated mentors can delete weekday registrations"
  on public.weekday_registrations for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- attendance: per-date attendance record for a mentee's session
-- ---------------------------------------------------------------------
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.mentees (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  weekday_registration_id uuid references public.weekday_registrations (id) on delete set null,
  session_date date not null,
  status public.attendance_status not null default 'present',
  created_at timestamptz not null default now(),
  unique (mentee_id, session_date)
);

create index attendance_mentee_id_idx on public.attendance (mentee_id);
create index attendance_mentor_id_idx on public.attendance (mentor_id);
create index attendance_session_date_idx on public.attendance (session_date);

alter table public.attendance enable row level security;

create policy "authenticated mentors can view attendance"
  on public.attendance for select
  to authenticated
  using (true);

create policy "mentors can record their own attendance"
  on public.attendance for insert
  to authenticated
  with check (mentor_id = auth.uid());

create policy "mentors can update their own attendance"
  on public.attendance for update
  to authenticated
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- ---------------------------------------------------------------------
-- session_log: mentor's written log for a mentee's session
-- ---------------------------------------------------------------------
create table public.session_logs (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.mentees (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  attendance_id uuid references public.attendance (id) on delete set null,
  session_date date not null,
  subject text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_logs_mentee_id_idx on public.session_logs (mentee_id);
create index session_logs_mentor_id_idx on public.session_logs (mentor_id);
create index session_logs_session_date_idx on public.session_logs (session_date);

alter table public.session_logs enable row level security;

create policy "authenticated mentors can view session logs"
  on public.session_logs for select
  to authenticated
  using (true);

create policy "mentors can insert their own session logs"
  on public.session_logs for insert
  to authenticated
  with check (mentor_id = auth.uid());

create policy "mentors can update their own session logs"
  on public.session_logs for update
  to authenticated
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

create policy "mentors can delete their own session logs"
  on public.session_logs for delete
  to authenticated
  using (mentor_id = auth.uid());

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger session_logs_set_updated_at
  before update on public.session_logs
  for each row execute function public.set_updated_at();
