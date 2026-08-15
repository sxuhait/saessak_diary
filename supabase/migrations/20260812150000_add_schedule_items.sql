-- Replaces the hardcoded SCHEDULE_ROWS array in src/app/schedule/page.tsx
-- with a real table so admins can edit the weekly schedule from the app
-- instead of a code change. Reuses the existing `class_color` enum for
-- `color` (same 8-pastel palette already used for classes/ColorPicker) so
-- no new color system is introduced.
--
-- Each row is one program block on one specific weekday -- there's no
-- "applies to all days" flag; a block that repeats every weekday (like
-- "센터 OPEN 청소") is seeded as 5 separate rows, one per weekday. This
-- keeps the model simple and matches the class_days precedent (one row per
-- occurrence) rather than introducing per-row multi-day selection.

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  title text not null,
  subtitle text,
  color public.class_color not null default 'sky',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_items_time_range_check check (end_time > start_time)
);

create index schedule_items_day_of_week_idx on public.schedule_items (day_of_week);
create index schedule_items_start_time_idx on public.schedule_items (start_time);

alter table public.schedule_items enable row level security;

create policy "authenticated mentors can view schedule items"
  on public.schedule_items for select
  to authenticated
  using (true);

create policy "admins can insert schedule items"
  on public.schedule_items for insert
  to authenticated
  with check (public.current_mentor_role() = 'admin');

create policy "admins can update schedule items"
  on public.schedule_items for update
  to authenticated
  using (public.current_mentor_role() = 'admin')
  with check (public.current_mentor_role() = 'admin');

create policy "admins can delete schedule items"
  on public.schedule_items for delete
  to authenticated
  using (public.current_mentor_role() = 'admin');

create trigger schedule_items_set_updated_at
  before update on public.schedule_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Seed: the "2026년 7월 8월 여름방학중 시간표" content that was previously
-- hardcoded, so the page shows the same thing it did before this migration.
-- day_of_week: 1=월 2=화 3=수 4=목 5=금 (0=일, 6=토 unused here).
-- ---------------------------------------------------------------------

insert into public.schedule_items (day_of_week, start_time, end_time, title, subtitle, color) values
  -- Daily routine blocks, repeated for every weekday
  (1, '08:00', '09:00', '센터 OPEN 청소', null, 'sky'),
  (2, '08:00', '09:00', '센터 OPEN 청소', null, 'sky'),
  (3, '08:00', '09:00', '센터 OPEN 청소', null, 'sky'),
  (4, '08:00', '09:00', '센터 OPEN 청소', null, 'sky'),
  (5, '08:00', '09:00', '센터 OPEN 청소', null, 'sky'),

  (1, '09:00', '10:00', '선생님들 업무준비', null, 'sky'),
  (2, '09:00', '10:00', '선생님들 업무준비', null, 'sky'),
  (3, '09:00', '10:00', '선생님들 업무준비', null, 'sky'),
  (4, '09:00', '10:00', '선생님들 업무준비', null, 'sky'),
  (5, '09:00', '10:00', '선생님들 업무준비', null, 'sky'),

  (1, '10:00', '10:30', '오전간식 및 보드게임 독서', null, 'sky'),
  (2, '10:00', '10:30', '오전간식 및 보드게임 독서', null, 'sky'),
  (3, '10:00', '10:30', '오전간식 및 보드게임 독서', null, 'sky'),
  (4, '10:00', '10:30', '오전간식 및 보드게임 독서', null, 'sky'),
  (5, '10:00', '10:30', '오전간식 및 보드게임 독서', null, 'sky'),

  -- 10:30~12:00
  (1, '10:30', '12:00', '숙제지도 및 기본 문제집 공부', null, 'violet'),
  (2, '10:30', '12:00', '숙제지도 및 기본 문제집 공부', null, 'violet'),
  (3, '10:30', '12:00', '숙제지도 및 기본 문제집 공부', null, 'violet'),
  (4, '10:30', '12:00', '영화감상/문화다양성교실', null, 'rose'),
  (5, '10:30', '12:00', '숙제지도 및 기본 문제집 공부', null, 'violet'),

  (1, '12:00', '13:30', '모둠 및 점심시간 휴게시간', null, 'sky'),
  (2, '12:00', '13:30', '모둠 및 점심시간 휴게시간', null, 'sky'),
  (3, '12:00', '13:30', '모둠 및 점심시간 휴게시간', null, 'sky'),
  (4, '12:00', '13:30', '모둠 및 점심시간 휴게시간', null, 'sky'),
  (5, '12:00', '13:30', '모둠 및 점심시간 휴게시간', null, 'sky'),

  (1, '13:30', '14:00', '오후 명상', null, 'sky'),
  (2, '13:30', '14:00', '오후 명상', null, 'sky'),
  (3, '13:30', '14:00', '오후 명상', null, 'sky'),
  (4, '13:30', '14:00', '오후 명상', null, 'sky'),
  (5, '13:30', '14:00', '오후 명상', null, 'sky'),

  (1, '14:00', '15:00', '작은도서관 독서활동', null, 'sky'),
  (2, '14:00', '15:00', '작은도서관 독서활동', null, 'sky'),
  (3, '14:00', '15:00', '작은도서관 독서활동', null, 'sky'),
  (4, '14:00', '15:00', '작은도서관 독서활동', null, 'sky'),
  (5, '14:00', '15:00', '작은도서관 독서활동', null, 'sky'),

  (1, '15:00', '15:30', '간식 및 휴게시간', null, 'sky'),
  (2, '15:00', '15:30', '간식 및 휴게시간', null, 'sky'),
  (3, '15:00', '15:30', '간식 및 휴게시간', null, 'sky'),
  (4, '15:00', '15:30', '간식 및 휴게시간', null, 'sky'),
  (5, '15:00', '15:30', '간식 및 휴게시간', null, 'sky'),

  -- 15:30~16:40 (parallel groups: several rows share the same day+time)
  (1, '15:30', '16:40', '공동체 활동', null, 'orange'),
  (1, '15:30', '16:40', '온라인 영어수업', null, 'cyan'),
  (2, '15:30', '16:40', 'kt&g미술', null, 'fuchsia'),
  (2, '15:30', '16:40', '기본 문제집 공부', null, 'violet'),
  (3, '15:30', '16:40', '로봇조립', null, 'indigo'),
  (3, '15:30', '16:40', '기본 문제집 공부', null, 'violet'),
  (4, '15:30', '16:40', '기초영어수업', null, 'cyan'),
  (4, '15:30', '16:40', '문화다양성교실', null, 'rose'),
  (5, '15:30', '16:40', '기초수학 수업', null, 'violet'),
  (5, '15:30', '16:40', '한글우체부 한글수업', null, 'teal'),

  (1, '16:50', '17:00', '저녁모임 및 저녁식사', null, 'sky'),
  (2, '16:50', '17:00', '저녁모임 및 저녁식사', null, 'sky'),
  (3, '16:50', '17:00', '저녁모임 및 저녁식사', null, 'sky'),
  (4, '16:50', '17:00', '저녁모임 및 저녁식사', null, 'sky'),
  (5, '16:50', '17:00', '저녁모임 및 저녁식사', null, 'sky'),

  -- 17:30~18:20
  (1, '17:30', '18:20', '기초학습', null, 'violet'),
  (1, '17:30', '18:20', '한글우체부 한글수업', null, 'teal'),
  (1, '17:30', '18:20', '온라인 영어수업', null, 'cyan'),
  (2, '17:30', '18:20', '요리활동', null, 'orange'),
  (2, '17:30', '18:20', '영재오케스트라', null, 'fuchsia'),
  (3, '17:30', '18:20', '기본 문제집 공부', null, 'violet'),
  (3, '17:30', '18:20', '미술동아리활동', null, 'fuchsia'),
  (3, '17:30', '18:20', '한글우체부 한글수업', null, 'teal'),
  (4, '17:30', '18:20', '동아리 연극부 연극수업', '대상: 연극부', 'rose'),
  (5, '17:30', '18:20', '독서논술', null, 'violet'),
  (5, '17:30', '18:20', '온라인영어', null, 'cyan'),

  -- 18:00~19:00 (월~목: 주간 귀가지도 runs the full hour; 금: its own 3 activities)
  (1, '18:00', '19:00', '주간 귀가지도', null, 'indigo'),
  (2, '18:00', '19:00', '주간 귀가지도', null, 'indigo'),
  (3, '18:00', '19:00', '주간 귀가지도', null, 'indigo'),
  (4, '18:00', '19:00', '주간 귀가지도', null, 'indigo'),
  (5, '18:00', '19:00', '기본 문제집 공부', null, 'violet'),
  (5, '18:00', '19:00', '골프존', null, 'orange'),
  (5, '18:00', '19:00', '온라인 영어', null, 'cyan'),

  -- 18:20~19:00 (월~목: specific activities running alongside 주간 귀가지도)
  (1, '18:20', '19:00', '골프존', null, 'orange'),
  (1, '18:20', '19:00', '기초학습', null, 'violet'),
  (1, '18:20', '19:00', '온라인영어수업', null, 'cyan'),
  (2, '18:20', '19:00', '기본 문제집 공부', null, 'violet'),
  (2, '18:20', '19:00', '골프존', null, 'orange'),
  (3, '18:20', '19:00', '기본 문제집 공부', null, 'violet'),
  (3, '18:20', '19:00', '골프존', null, 'orange'),
  (3, '18:20', '19:00', '내꿈은 파티시웨', null, 'fuchsia'),
  (4, '18:20', '19:00', '보드게임', null, 'orange'),

  (1, '19:00', '20:00', '업무마무리 및 고학년 중학생 귀가지도', '월·수·금 이동호 온라인 멘토링 학습지도', 'sky'),
  (2, '19:00', '20:00', '업무마무리 및 고학년 중학생 귀가지도', '월·수·금 이동호 온라인 멘토링 학습지도', 'sky'),
  (3, '19:00', '20:00', '업무마무리 및 고학년 중학생 귀가지도', '월·수·금 이동호 온라인 멘토링 학습지도', 'sky'),
  (4, '19:00', '20:00', '업무마무리 및 고학년 중학생 귀가지도', '월·수·금 이동호 온라인 멘토링 학습지도', 'sky'),
  (5, '19:00', '20:00', '업무마무리 및 고학년 중학생 귀가지도', '월·수·금 이동호 온라인 멘토링 학습지도', 'sky');
