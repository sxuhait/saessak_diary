-- Classes can now run on multiple weekdays (e.g. 기초영어 = 월·수) instead of
-- being pinned to exactly one. Introduces `class_days` as a many-to-many
-- join table (same shape/RLS pattern as class_enrollments), backfills every
-- existing class's single day into it, then drops the now-redundant
-- `classes.day_of_week` column so there's only one source of truth for a
-- class's schedule going forward.

create table public.class_days (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  created_at timestamptz not null default now(),
  unique (class_id, day_of_week)
);

create index class_days_class_id_idx on public.class_days (class_id);
create index class_days_day_of_week_idx on public.class_days (day_of_week);

alter table public.class_days enable row level security;

create policy "authenticated mentors can view class days"
  on public.class_days for select
  to authenticated
  using (true);

create policy "admins can insert class days"
  on public.class_days for insert
  to authenticated
  with check (public.current_mentor_role() = 'admin');

create policy "admins can delete class days"
  on public.class_days for delete
  to authenticated
  using (public.current_mentor_role() = 'admin');

-- Backfill: every existing class keeps its single day, now as a class_days row.
insert into public.class_days (class_id, day_of_week)
select id, day_of_week from public.classes;

alter table public.classes drop column day_of_week;
