-- Storage bucket + RLS for center_events photo uploads (photo_urls column
-- has existed since 20260729124812 but had no upload path). Public bucket
-- so gallery <img> tags can hit the object URL directly with no signing --
-- events/photos are already fully shared, non-sensitive data, same trust
-- level as center_events rows themselves. Size/mime limits are enforced
-- here as the source of truth; the upload server action re-checks the same
-- limits client-visibly before spending an upload attempt.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-photos',
  'event-photos',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Read is only relevant for the storage API itself (list/programmatic
-- fetch); the public bucket already serves objects by URL without going
-- through these policies, so this isn't what gates the <img> gallery.
create policy "authenticated mentors can view event photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'event-photos' and not public.current_mentor_blocked());

create policy "authenticated mentors can upload event photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-photos' and not public.current_mentor_blocked());

create policy "authenticated mentors can delete event photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-photos' and not public.current_mentor_blocked());
