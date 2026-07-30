-- Tighten RLS so a mentor can only see mentees/attendance/session_logs for
-- mentees actually assigned to them via weekday_registrations.
--
-- The phase-1 migration used `using (true)` (shared roster) for these SELECT
-- policies, which meant any authenticated mentor could read any other
-- mentor's session logs. The product requirement is that each mentor only
-- sees their own mentees' records, so we scope by weekday_registrations
-- instead.

-- ---------------------------------------------------------------------
-- mentees: visible/editable only if the mentor has a weekday_registration
-- for that mentee. (Insert stays open -- creating a mentee record doesn't
-- assign a mentor by itself; that happens via weekday_registrations.)
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can view mentees" on public.mentees;
drop policy "authenticated mentors can update mentees" on public.mentees;

create policy "mentors can view their assigned mentees"
  on public.mentees for select
  to authenticated
  using (
    exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = mentees.id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can update their assigned mentees"
  on public.mentees for update
  to authenticated
  using (
    exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = mentees.id
        and wr.mentor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = mentees.id
        and wr.mentor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- weekday_registrations: a mentor only sees/manages their own assignments
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can view weekday registrations" on public.weekday_registrations;
drop policy "authenticated mentors can insert weekday registrations" on public.weekday_registrations;
drop policy "authenticated mentors can update weekday registrations" on public.weekday_registrations;
drop policy "authenticated mentors can delete weekday registrations" on public.weekday_registrations;

create policy "mentors can view their own weekday registrations"
  on public.weekday_registrations for select
  to authenticated
  using (mentor_id = auth.uid());

create policy "mentors can insert their own weekday registrations"
  on public.weekday_registrations for insert
  to authenticated
  with check (mentor_id = auth.uid());

create policy "mentors can update their own weekday registrations"
  on public.weekday_registrations for update
  to authenticated
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

create policy "mentors can delete their own weekday registrations"
  on public.weekday_registrations for delete
  to authenticated
  using (mentor_id = auth.uid());

-- ---------------------------------------------------------------------
-- attendance: readable only for mentees assigned to the mentor; writes
-- pinned to the acting mentor AND require that mentor-mentee assignment
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can view attendance" on public.attendance;
drop policy "mentors can record their own attendance" on public.attendance;
drop policy "mentors can update their own attendance" on public.attendance;

create policy "mentors can view attendance for their mentees"
  on public.attendance for select
  to authenticated
  using (
    exists (
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
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can update attendance for their mentees"
  on public.attendance for update
  to authenticated
  using (mentor_id = auth.uid())
  with check (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- session_logs: readable only for mentees assigned to the mentor; writes
-- pinned to the acting mentor AND require that mentor-mentee assignment
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can view session logs" on public.session_logs;
drop policy "mentors can insert their own session logs" on public.session_logs;
drop policy "mentors can update their own session logs" on public.session_logs;

create policy "mentors can view session logs for their mentees"
  on public.session_logs for select
  to authenticated
  using (
    exists (
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
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = session_logs.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

create policy "mentors can update session logs for their mentees"
  on public.session_logs for update
  to authenticated
  using (mentor_id = auth.uid())
  with check (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = session_logs.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );

-- "mentors can delete their own session logs" (mentor_id = auth.uid()) is
-- left unchanged: a mentor can only ever delete a log they authored, and
-- they could only have authored it for a mentee they were assigned to.
