-- Tightens the fully-shared CRUD model introduced in 20260806130000: that
-- migration made mentees/attendance/session_logs completely open (anyone can
-- edit/delete anyone else's records) to match this center's "no assigned
-- mentor" workflow. In practice that's too permissive for destructive
-- actions -- a mis-click can delete another mentor's work, or a mentee's
-- entire history (mentees cascades to attendance/session_logs/
-- class_enrollments). This migration narrows just the risky operations:
--
--   - session_logs: update/delete restricted to the mentor who wrote the
--     entry (mentor_id = auth.uid()). Viewing/inserting stay fully shared.
--   - attendance: same owner-only restriction on update/delete. Since
--     setAttendance() upserts (insert-or-update on mentee_id+session_date),
--     this means a mentor can only change a day's status if they're the one
--     who last recorded it -- Postgres enforces the UPDATE policy's USING
--     clause against the pre-existing row on the ON CONFLICT DO UPDATE path.
--   - mentees: delete restricted to admins only (insert/update stay shared
--     -- any mentor can still add/rename mentees). Deleting a mentee cascades
--     their attendance/session_logs/class_enrollments, so this is the
--     highest-blast-radius action in the app.
--   - center_events: delete restricted to admins only (insert/update stay
--     shared, matching how classes already split "catalog deletion" from
--     "day-to-day editing").
--
-- classes already went admin-only for insert/update/delete in 20260806130000
-- and needs no change here.

-- ---------------------------------------------------------------------
-- session_logs: owner-only update/delete
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can update session logs" on public.session_logs;
drop policy "authenticated mentors can delete session logs" on public.session_logs;

create policy "mentors can update their own session logs"
  on public.session_logs for update
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked())
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "mentors can delete their own session logs"
  on public.session_logs for delete
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- attendance: owner-only update/delete
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can update attendance" on public.attendance;
drop policy "authenticated mentors can delete attendance" on public.attendance;

create policy "mentors can update their own attendance records"
  on public.attendance for update
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked())
  with check (mentor_id = auth.uid() and not public.current_mentor_blocked());

create policy "mentors can delete their own attendance records"
  on public.attendance for delete
  to authenticated
  using (mentor_id = auth.uid() and not public.current_mentor_blocked());

-- ---------------------------------------------------------------------
-- mentees: admin-only delete (insert/update stay fully shared)
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can delete mentees" on public.mentees;

create policy "admins can delete mentees"
  on public.mentees for delete
  to authenticated
  using (public.current_mentor_role() = 'admin');

-- ---------------------------------------------------------------------
-- center_events: admin-only delete (insert/update stay fully shared)
-- ---------------------------------------------------------------------
drop policy "authenticated mentors can delete center events" on public.center_events;

create policy "admins can delete center events"
  on public.center_events for delete
  to authenticated
  using (public.current_mentor_role() = 'admin');
