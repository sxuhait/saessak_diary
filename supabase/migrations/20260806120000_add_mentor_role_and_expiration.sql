-- Adds role distinction (mentor / volunteer / admin) to mentors, and an
-- expiration rule for volunteers: access is blocked once 30 days pass with
-- no activity (session_logs/attendance) from that mentor, falling back to
-- signup date if they never logged anything.
--
-- Enforcement layers:
--   1. RLS on mentor-scoped tables (mentees, weekday_registrations,
--      attendance, session_logs, class_enrollments) via
--      public.current_mentor_blocked() -- so even a direct API call can't
--      bypass expiration.
--   2. proxy.ts (middleware) and the login server action also check
--      is_volunteer_expired and block/redirect before a page ever renders.
-- center_events/classes/class_cancellations stay fully shared per the
-- existing model (CLAUDE.md) -- they're not mentor-scoped, so expiration
-- there is enforced only at the app layer (proxy blocks all page access).

-- ---------------------------------------------------------------------
-- role column
-- ---------------------------------------------------------------------
create type public.mentor_role as enum ('mentor', 'volunteer', 'admin');

alter table public.mentors
  add column role public.mentor_role not null default 'mentor';

-- Nullable timestamp an admin can bump (e.g. `now()`) to extend/reactivate
-- a volunteer without requiring them to log new activity first.
alter table public.mentors
  add column reactivated_at timestamptz;

-- signup only ever offers 'mentor' or 'volunteer' (validated client + server
-- side), but re-validate here too since raw_user_meta_data is technically
-- reachable via the auth API directly -- anything other than the two
-- allowed values (including 'admin') silently falls back to 'mentor'.
create or replace function public.handle_new_mentor()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.mentors (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    case
      when requested_role in ('mentor', 'volunteer')
        then requested_role::public.mentor_role
      else 'mentor'::public.mentor_role
    end
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- expiration functions
-- ---------------------------------------------------------------------

-- Most recent activity timestamp for a mentor: latest session_logs/
-- attendance row they wrote, or their reactivated_at bump, or signup date.
-- security definer so it can read across all mentors' logs regardless of
-- the caller's own RLS-scoped visibility (needed since it runs inside RLS
-- policies below).
create function public.mentor_last_activity(p_mentor_id uuid)
returns timestamptz
language sql
stable
security definer set search_path = public
as $$
  select greatest(
    coalesce((select max(sl.created_at) from public.session_logs sl where sl.mentor_id = p_mentor_id), '-infinity'::timestamptz),
    coalesce((select max(a.created_at) from public.attendance a where a.mentor_id = p_mentor_id), '-infinity'::timestamptz),
    coalesce((select m.reactivated_at from public.mentors m where m.id = p_mentor_id), '-infinity'::timestamptz),
    coalesce((select m.created_at from public.mentors m where m.id = p_mentor_id), '-infinity'::timestamptz)
  );
$$;

-- Separated out from current_mentor_blocked() below so an admin
-- reactivation flow (or a future scheduled job) can call it directly for
-- any mentor id, not just the caller.
create function public.is_volunteer_expired(p_mentor_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    (
      select m.role = 'volunteer'
        and public.mentor_last_activity(p_mentor_id) < now() - interval '30 days'
      from public.mentors m
      where m.id = p_mentor_id
    ),
    false
  );
$$;

-- Convenience wrapper for RLS policies / RPC calls scoped to the caller.
create function public.current_mentor_blocked()
returns boolean
language sql
stable
as $$
  select public.is_volunteer_expired(auth.uid());
$$;

revoke execute on function public.mentor_last_activity(uuid) from public;
revoke execute on function public.is_volunteer_expired(uuid) from public;
revoke execute on function public.current_mentor_blocked() from public;
grant execute on function public.mentor_last_activity(uuid) to authenticated;
grant execute on function public.is_volunteer_expired(uuid) to authenticated;
grant execute on function public.current_mentor_blocked() to authenticated;

-- ---------------------------------------------------------------------
-- mentees: block expired volunteers from creating/viewing/editing
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can insert mentees" on public.mentees;
drop policy "mentors can view their assigned mentees" on public.mentees;
drop policy "mentors can update their assigned mentees" on public.mentees;

create policy "authenticated mentors can insert mentees"
  on public.mentees for insert
  to authenticated
  with check (not public.current_mentor_blocked());

create policy "mentors can view their assigned mentees"
  on public.mentees for select
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = mentees.id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can update their assigned mentees"
  on public.mentees for update
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = mentees.id
        and wr.mentor_id = auth.uid()
    )
  )
  with check (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = mentees.id
        and wr.mentor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- weekday_registrations
-- ---------------------------------------------------------------------
drop policy "mentors can view their own weekday registrations" on public.weekday_registrations;
drop policy "mentors can insert their own weekday registrations" on public.weekday_registrations;
drop policy "mentors can update their own weekday registrations" on public.weekday_registrations;
drop policy "mentors can delete their own weekday registrations" on public.weekday_registrations;

create policy "mentors can view their own weekday registrations"
  on public.weekday_registrations for select
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "mentors can insert their own weekday registrations"
  on public.weekday_registrations for insert
  to authenticated
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "mentors can update their own weekday registrations"
  on public.weekday_registrations for update
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked())
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "mentors can delete their own weekday registrations"
  on public.weekday_registrations for delete
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------
drop policy "mentors can view attendance for their mentees" on public.attendance;
drop policy "mentors can record attendance for their mentees" on public.attendance;
drop policy "mentors can update attendance for their mentees" on public.attendance;
drop policy "mentors can delete attendance for their mentees" on public.attendance;

create policy "mentors can view attendance for their mentees"
  on public.attendance for select
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can record attendance for their mentees"
  on public.attendance for insert
  to authenticated
  with check (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can update attendance for their mentees"
  on public.attendance for update
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked())
  with check (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can delete attendance for their mentees"
  on public.attendance for delete
  to authenticated
  using (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- session_logs
-- ---------------------------------------------------------------------
drop policy "mentors can view session logs for their mentees" on public.session_logs;
drop policy "mentors can insert session logs for their mentees" on public.session_logs;
drop policy "mentors can update session logs for their mentees" on public.session_logs;
drop policy "mentors can delete their own session logs" on public.session_logs;

create policy "mentors can view session logs for their mentees"
  on public.session_logs for select
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = session_logs.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can insert session logs for their mentees"
  on public.session_logs for insert
  to authenticated
  with check (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = session_logs.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can update session logs for their mentees"
  on public.session_logs for update
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked())
  with check (
    mentor_id = auth.uid()
    and not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = session_logs.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can delete their own session logs"
  on public.session_logs for delete
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- class_enrollments
-- ---------------------------------------------------------------------
drop policy "mentors can view enrollments for their mentees" on public.class_enrollments;
drop policy "mentors can enroll their mentees in classes" on public.class_enrollments;
drop policy "mentors can unenroll their mentees from classes" on public.class_enrollments;

create policy "mentors can view enrollments for their mentees"
  on public.class_enrollments for select
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = class_enrollments.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can enroll their mentees in classes"
  on public.class_enrollments for insert
  to authenticated
  with check (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = class_enrollments.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can unenroll their mentees from classes"
  on public.class_enrollments for delete
  to authenticated
  using (
    not public.current_mentor_blocked()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = class_enrollments.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );
