-- Add a freeform "progress" field to session_logs (e.g. "문제집 45~52p", "3단원"),
-- separate from the narrative "content" field, so subject-level aggregation
-- (last progress per subject) can read a short structured value instead of
-- parsing prose.

alter table public.session_logs add column progress text;
