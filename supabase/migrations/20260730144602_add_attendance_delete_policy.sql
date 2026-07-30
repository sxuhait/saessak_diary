-- attendance never had a DELETE policy (only select/insert/update). Needed
-- so a mentor can undo a mis-click by clearing a day's attendance entirely,
-- same mentor-scoping as the existing update policy.
create policy "mentors can delete attendance for their mentees"
  on public.attendance for delete
  to authenticated
  using (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.weekday_registrations wr
      where wr.mentee_id = attendance.mentee_id
        and wr.mentor_id = auth.uid()
    )
  );
