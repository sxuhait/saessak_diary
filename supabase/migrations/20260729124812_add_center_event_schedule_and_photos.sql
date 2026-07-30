-- Detail-page support for center_events: a longer free-text itinerary
-- separate from the short `description`, and a slot for photo URLs to be
-- wired up once photo upload UI exists (not built yet).
alter table public.center_events
  add column schedule text,
  add column photo_urls text[] not null default '{}'::text[];
