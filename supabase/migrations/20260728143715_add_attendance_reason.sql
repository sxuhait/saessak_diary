-- Add an optional free-text reason, used when attendance status is
-- 'excused' (사유결석) so the mentor can record why the mentee was out.
alter table public.attendance
  add column reason text;
