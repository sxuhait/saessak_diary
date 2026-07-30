-- Per-date exceptions to a class's normal weekly recurrence (e.g. teacher on
-- summer vacation for one week). Shared across all mentors like `classes`
-- itself -- NOT scoped per mentor.
create table public.class_cancellations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  cancelled_date date not null,
  created_at timestamptz not null default now(),
  unique (class_id, cancelled_date)
);

create index class_cancellations_class_id_idx on public.class_cancellations (class_id);
create index class_cancellations_cancelled_date_idx on public.class_cancellations (cancelled_date);

alter table public.class_cancellations enable row level security;

create policy "authenticated mentors can view class cancellations"
  on public.class_cancellations for select
  to authenticated
  using (true);

create policy "authenticated mentors can insert class cancellations"
  on public.class_cancellations for insert
  to authenticated
  with check (true);

create policy "authenticated mentors can delete class cancellations"
  on public.class_cancellations for delete
  to authenticated
  using (true);
