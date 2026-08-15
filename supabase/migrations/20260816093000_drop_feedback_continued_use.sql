-- Removes the "will you keep using this" feedback question -- the modal
-- now only asks rating, useful_feature, and pain_point (see feedback-modal.tsx).

alter table public.feedback
  drop column will_continue;

drop type public.feedback_continued_use;
