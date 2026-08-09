-- mentees never had a DELETE policy -- RLS defaults to deny when no policy
-- matches, so deletes were only ever possible from the SQL editor (bypassing
-- RLS) even though select/insert/update have been fully shared since
-- 20260806130000. The app now offers "학생 삭제" from /mentees, so add the
-- matching delete policy with the same "not blocked" gate as insert/update.
--
-- attendance.mentee_id, session_logs.mentee_id, and class_enrollments.mentee_id
-- are all `references mentees(id) on delete cascade` already (since
-- 20260728121422 / 20260730134002), so deleting a mentee here correctly
-- cascades their attendance/session_logs/class_enrollments with no extra
-- migration needed -- the app's delete confirmation warns about this.
create policy "authenticated mentors can delete mentees"
  on public.mentees for delete
  to authenticated
  using (not public.current_mentor_blocked());
