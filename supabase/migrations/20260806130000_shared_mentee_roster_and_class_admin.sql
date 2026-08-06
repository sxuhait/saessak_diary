-- Removes the "assigned mentor" model: this center doesn't assign specific
-- mentees to specific mentors -- any mentor/volunteer/admin can teach any
-- mentee. mentees/attendance/session_logs/class_enrollments move from
-- per-mentor RLS scoping (via weekday_registrations) to fully shared CRUD,
-- the same pattern center_events/classes already use. mentor_id on
-- attendance/session_logs stays as write-time attribution only (who
-- recorded it), never as an access-control field -- same role
-- center_events.created_by already plays.
--
-- weekday_registrations was the sole source of truth for that assignment
-- and has zero application code depending on it otherwise (confirmed no
-- reads/writes anywhere in src/), so it's dropped outright rather than
-- repurposed -- keeping it around as a defunct table (or improvising a new
-- meaning for it) would just be confusing. attendance.weekday_registration_id
-- was an always-unused nullable FK into it and is dropped with it.
--
-- Also adds the first role-gated table in the schema: classes can still be
-- *viewed* by anyone, but creating/editing/deleting a class now requires
-- role = 'admin'. Mentors/volunteers keep full CRUD on class_cancellations
-- (day-to-day "이번 주 휴강 처리") -- that's an operational toggle, not
-- catalog management, and wasn't part of this request.

-- ---------------------------------------------------------------------
-- mentees: drop assignment-scoped select/update, make fully shared
-- (insert was already open to any non-blocked authenticated mentor)
-- ---------------------------------------------------------------------
drop policy "mentors can view their assigned mentees" on public.mentees;
drop policy "mentors can update their assigned mentees" on public.mentees;

create policy "authenticated mentors can view mentees"
  on public.mentees for select
  to authenticated
  using (not public.current_mentor_blocked());

create policy "authenticated mentors can update mentees"
  on public.mentees for update
  to authenticated
  using (not public.current_mentor_blocked())
  with check (not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- attendance: fully shared. mentor_id stays required on insert (who
-- recorded it) but is no longer a scoping condition for select/update/delete.
-- ---------------------------------------------------------------------
drop policy "mentors can view attendance for their mentees" on public.attendance;
drop policy "mentors can record attendance for their mentees" on public.attendance;
drop policy "mentors can update attendance for their mentees" on public.attendance;
drop policy "mentors can delete attendance for their mentees" on public.attendance;

create policy "authenticated mentors can view attendance"
  on public.attendance for select
  to authenticated
  using (not public.current_mentor_blocked());

create policy "authenticated mentors can record attendance"
  on public.attendance for insert
  to authenticated
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "authenticated mentors can update attendance"
  on public.attendance for update
  to authenticated
  using (not public.current_mentor_blocked())
  with check (not public.current_mentor_blocked());

create policy "authenticated mentors can delete attendance"
  on public.attendance for delete
  to authenticated
  using (not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- session_logs: same shared pattern. mentor_id stays required on insert
-- (this is the "작성 멘토" attribution shown in the UI).
-- ---------------------------------------------------------------------
drop policy "mentors can view session logs for their mentees" on public.session_logs;
drop policy "mentors can insert session logs for their mentees" on public.session_logs;
drop policy "mentors can update session logs for their mentees" on public.session_logs;
drop policy "mentors can delete their own session logs" on public.session_logs;

create policy "authenticated mentors can view session logs"
  on public.session_logs for select
  to authenticated
  using (not public.current_mentor_blocked());

create policy "authenticated mentors can insert session logs"
  on public.session_logs for insert
  to authenticated
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "authenticated mentors can update session logs"
  on public.session_logs for update
  to authenticated
  using (not public.current_mentor_blocked())
  with check (not public.current_mentor_blocked());

create policy "authenticated mentors can delete session logs"
  on public.session_logs for delete
  to authenticated
  using (not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- class_enrollments: fully shared, no more weekday_registrations exists() check
-- ---------------------------------------------------------------------
drop policy "mentors can view enrollments for their mentees" on public.class_enrollments;
drop policy "mentors can enroll their mentees in classes" on public.class_enrollments;
drop policy "mentors can unenroll their mentees from classes" on public.class_enrollments;

create policy "authenticated mentors can view enrollments"
  on public.class_enrollments for select
  to authenticated
  using (not public.current_mentor_blocked());

create policy "authenticated mentors can enroll mentees in classes"
  on public.class_enrollments for insert
  to authenticated
  with check (not public.current_mentor_blocked());

create policy "authenticated mentors can unenroll mentees from classes"
  on public.class_enrollments for delete
  to authenticated
  using (not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- drop weekday_registrations entirely (see header note)
-- ---------------------------------------------------------------------
alter table public.attendance drop column weekday_registration_id;

drop policy "mentors can view their own weekday registrations" on public.weekday_registrations;
drop policy "mentors can insert their own weekday registrations" on public.weekday_registrations;
drop policy "mentors can update their own weekday registrations" on public.weekday_registrations;
drop policy "mentors can delete their own weekday registrations" on public.weekday_registrations;

drop table public.weekday_registrations;

-- ---------------------------------------------------------------------
-- classes: view stays open to everyone, mutation becomes admin-only
-- ---------------------------------------------------------------------
create function public.current_mentor_role()
returns public.mentor_role
language sql
stable
as $$
  select role from public.mentors where id = auth.uid();
$$;

revoke execute on function public.current_mentor_role() from public;
grant execute on function public.current_mentor_role() to authenticated;

drop policy "authenticated mentors can insert classes" on public.classes;
drop policy "authenticated mentors can update classes" on public.classes;
drop policy "authenticated mentors can delete classes" on public.classes;

create policy "admins can insert classes"
  on public.classes for insert
  to authenticated
  with check (public.current_mentor_role() = 'admin');

create policy "admins can update classes"
  on public.classes for update
  to authenticated
  using (public.current_mentor_role() = 'admin')
  with check (public.current_mentor_role() = 'admin');

create policy "admins can delete classes"
  on public.classes for delete
  to authenticated
  using (public.current_mentor_role() = 'admin');
