-- Center-wide events (field trips, overnight camps, etc.) shared across all
-- mentors -- unlike mentees/attendance/session_logs, this is NOT scoped per
-- mentor. Every authenticated mentor can view, add, and edit these.

create type public.center_event_type as enum ('field_trip', 'camp', 'other');

create table public.center_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type public.center_event_type not null default 'other',
  start_date date not null,
  end_date date not null,
  location text,
  description text,
  created_by uuid references public.mentors (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint center_events_date_range_check check (end_date >= start_date)
);

create index center_events_start_date_idx on public.center_events (start_date);
create index center_events_end_date_idx on public.center_events (end_date);

alter table public.center_events enable row level security;

create policy "authenticated mentors can view center events"
  on public.center_events for select
  to authenticated
  using (true);

create policy "authenticated mentors can insert center events"
  on public.center_events for insert
  to authenticated
  with check (true);

create policy "authenticated mentors can update center events"
  on public.center_events for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated mentors can delete center events"
  on public.center_events for delete
  to authenticated
  using (true);

create trigger center_events_set_updated_at
  before update on public.center_events
  for each row execute function public.set_updated_at();
