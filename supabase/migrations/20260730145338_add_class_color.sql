-- Per-class fixed color, used to distinguish multiple classes on the same
-- day in the calendar (colored dot per class, up to one per class per day).
create type public.class_color as enum (
  'rose',
  'orange',
  'violet',
  'sky',
  'fuchsia',
  'indigo',
  'teal',
  'cyan'
);

alter table public.classes
  add column color public.class_color not null default 'rose';
