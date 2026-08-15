-- Extends the feedback box with three optional questions, all nullable so
-- a mentor can still submit with just a star rating (see feedback-modal.tsx):
--   - useful_feature: which part of the app they found most useful
--   - pain_point: a short free-text note on what was annoying/lacking
--   - will_continue: whether they expect to keep using the app
-- No RLS changes needed -- the existing insert/select policies on
-- public.feedback already apply to the whole row regardless of columns.

create type public.feedback_useful_feature as enum (
  'session_log',
  'diagnostics',
  'attendance',
  'schedule',
  'other'
);

create type public.feedback_continued_use as enum ('yes', 'no', 'unsure');

alter table public.feedback
  add column useful_feature public.feedback_useful_feature,
  add column pain_point text,
  add column will_continue public.feedback_continued_use;
