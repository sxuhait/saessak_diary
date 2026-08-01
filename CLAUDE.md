# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this project is

**saessak_diary** (새싹 다이어리) is a mentoring copilot web app for community child center mentors. "새싹" (sprout) is just the project name — a metaphor for the kids growing, not a literal plant app.

- Mentors log in, see their assigned mentees, write session logs, and check attendance per mentee.
- The center also runs shared events (field trips, overnight camps) that every mentor sees on one common calendar, independent of mentor-mentee assignment.
- Eventually an AI will analyze accumulated session logs to surface each kid's learning weaknesses and suggest focus points for the next session — **not yet implemented** (see Roadmap).

Phase 1 (login → mentee list → session-log form → save to Supabase) and the attendance/event-calendar work that followed are done. What's left is listed under Roadmap.

## ⚠️ Next.js version warning

This project pins a Next.js version whose App Router APIs differ from what you may expect from training data (see `AGENTS.md`). Before writing App Router code, check `node_modules/next/dist/docs/01-app/` for the current API. Two differences already load-bearing in this repo:

- **`middleware.ts` is renamed `proxy.ts`**, and the exported function must be named `proxy` (or be a default export), not `middleware`. See `src/proxy.ts`.
- **`cookies()` (from `next/headers`) is async** — always `await cookies()`.

## Commands

```bash
npm run dev          # start dev server (Turbopack) at localhost:3000
npm run build        # production build
npm run start        # run a production build
npm run lint         # eslint
npx tsc --noEmit     # typecheck
```

### Supabase (via npx — no global install)

The project is linked to a real hosted Supabase project (link state lives in `supabase/.temp/`, gitignored). Normal schema-change workflow:

```bash
npx supabase migration new <name>       # create a new migration file in supabase/migrations
# ...edit the generated .sql file...
npx supabase db push --linked --dry-run # sanity-check what would be applied
npx supabase db push --linked           # apply it to the real hosted project
npx supabase migration list --linked    # confirm local migrations match what's applied remotely
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

**Run `gen types` through Git Bash or WSL, never Windows PowerShell 5.1.** PowerShell's `>` redirect defaults to UTF-16 and silently corrupts the generated file (every character gets null-byte-padded — `file src/lib/database.types.ts` will show `UTF-16` instead of `ASCII text` if this happens). If TypeScript suddenly can't parse `database.types.ts` after a teammate regenerates it, this is why — just rerun the command from Bash.

`src/lib/database.types.ts` is wired into `createClient<Database>(...)` in both `src/lib/supabase/client.ts` and `server.ts` — regenerate it any time the schema changes, then `npx tsc --noEmit` to catch call sites that need updating.

Local Supabase stack (`npx supabase start`) requires Docker Desktop, which hasn't been available in this dev environment — all schema work so far has gone straight to the linked hosted project instead of a local shadow DB.

Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project settings (Settings → API) before running the app.

## Architecture

- Next.js App Router, TypeScript, Tailwind v4, `src/` layout. Path alias `@/*` → `./src/*`.
- Supabase (Postgres + Auth) is the entire backend — no separate API server. Data access goes through Supabase client helpers, not a custom REST/GraphQL layer.
- Auth session refresh happens in `src/proxy.ts` (via `src/lib/supabase/proxy.ts`'s `updateSession`), which also redirects unauthenticated requests to `/login` unless the path is under `/login` or `/auth`. Add new public paths to `PUBLIC_PATHS` in `src/lib/supabase/proxy.ts`.
- Three Supabase client entry points, each for a different execution context — always use the one matching where the code runs:
  - `src/lib/supabase/client.ts` — browser/Client Components (`createBrowserClient`).
  - `src/lib/supabase/server.ts` — Server Components, Server Actions, Route Handlers (`createServerClient`, async — reads cookies via `await cookies()`).
  - `src/lib/supabase/proxy.ts` — proxy-only session refresh, operates on the `NextRequest`/`NextResponse` cookie jars directly.
- Mutations are Server Actions (`'use server'`), not client-side fetch + Route Handlers. Every Server Action independently re-checks auth (`supabase.auth.getUser()`) — never trust that a form was only reachable from an authenticated page. Actions live next to the route that uses them (e.g. `src/app/mentees/[menteeId]/actions.ts`, `src/app/events/[eventId]/actions.ts`), not in one shared file.
- After a mutation that should update the current view without navigating away, call either `revalidatePath(...)` (from `next/cache`, re-render triggered as part of the action's response) or, for actions invoked directly from an `onClick` rather than a `<form>`, `refresh()` (also `next/cache`) — see `src/app/mentees/[menteeId]/attendance/actions.ts` for the `refresh()` pattern.

### Routes

| Route | Purpose |
| --- | --- |
| `/login` | Email/password sign-in (Supabase Auth), only public route besides `/auth/*` |
| `/` | Home dashboard: today's date, my mentee count, this-week center-event count, links into `/mentees` and `/events` |
| `/mentees` | List of mentees assigned to the logged-in mentor (RLS does the filtering — no explicit join needed in the query) |
| `/mentees/[menteeId]` | Session-log form (date, subject, progress, content) + monthly calendar of that mentee's logs (dot per day with a log, click a day to see that day's logs) + subject-summary table (last studied date/days-ago/latest progress per subject, staleness warning at 14+ days — see `subject-summary.tsx`) + full chronological log list |
| `/mentees/[menteeId]/attendance` | Separate monthly calendar for attendance only. Click a day → present/absent/late/excused buttons; late/excused reveal a reason textarea (stored in `attendance.reason`); re-clicking a day reloads its saved state |
| `/events` | Center-wide event calendar (field trips, camps), shared by all mentors regardless of mentee assignment. Click a day to see/add events for that day |
| `/events/[eventId]` | Event detail with inline view ↔ edit toggle and delete (confirm dialog, then redirect to `/events`) |
| `/schedule` | Center weekly timetable (Mon–Fri × 09:00–20:00), hardcoded in `schedule/page.tsx` — no `center_schedule` table yet, so this is display-only until an edit UI is built |

### Calendar UI pattern (react-day-picker)

Three different calendars (`log-calendar.tsx`, `mentees/[menteeId]/attendance/attendance-calendar.tsx`, `events/events-calendar.tsx`) all follow the same shape: `DayPicker` with a `modifiers` map (date arrays per category) + `modifiersClassNames`, and day coloring done via plain CSS in `globals.css` rather than Tailwind classes, because `modifiersClassNames` only lets you attach a class name to the day cell — actual styling has to be plain CSS targeting `.rdp-day_button` under that class (e.g. `.att-present .rdp-day_button { background-color: ...; }`). When overriding a value react-day-picker sets on `.rdp-root` itself (like `--rdp-accent-color`), use the doubled-selector trick `.rdp-root.rdp-root { ... }` to win on specificity — otherwise the result depends on unpredictable CSS import order between `globals.css` and `react-day-picker/style.css`.

Multi-day date ranges (event `start_date`..`end_date`) are rendered by putting every date in the range into the same modifier array — there's no real "connected bar" rendering, just consecutive same-colored day circles, which reads as continuous.

`src/components/date-picker.tsx` is a reusable popover single-date picker (button + `DayPicker` in an absolutely-positioned panel, closes on outside click) used anywhere a form needs a date field — session-log date, attendance day selection context, event start/end dates.

### Korean holiday data (`src/lib/holidays.ts`)

`KOREAN_HOLIDAYS` is a hand-maintained `{ "YYYY-MM-DD": "홀리데이 이름" }` map, currently covering **2025–2027**. It's a plain data file, not a library or API call — deliberately, since lunar-calendar holidays (설날, 추석, 부처님오신날) and 대체공휴일 (substitute-holiday) rules aren't computable without a lunar calendar table anyway, and this app is a single-center internal tool where an API key + network dependency for holiday lookups would be more fragile than it's worth. `isCenterClosed(date)` (weekend OR holiday) and `getHolidayName(date)` are used by `classes/class-calendar.tsx` and `mentees/[menteeId]/attendance/attendance-calendar.tsx` to gray out non-operating days and hide classes/attendance-entry on them.

**Update it once a year, in December**, once the government publishes next year's calendar (관공서의 공휴일에 관한 규정) — or sooner if `KOREAN_HOLIDAYS` no longer has an entry for "next year." Cross-check dates across at least two independent sources before adding (search "OOOO년 대한민국 공휴일 대체공휴일" — lunar-calendar and substitute-holiday dates are easy to get subtly wrong from memory alone; this list was built by web search + cross-referencing multiple holiday-calendar sites, not from training data). Deliberately excluded: 근로자의 날 (Labor Day) and 제헌절 (Constitution Day) — neither is a 관공서 공휴일, so the center/schools aren't closed on those days.

### Color theme ("새싹 그린")

Single light theme, no dark mode (there's no `dark:` class anywhere in `src/` — a system dark-mode preference used to force a black background here, which is why it was removed). Palette:

- Background/cards: `stone-50` (page) / `white` (cards) / `stone-200` borders.
- Text: `stone-900` (headings/body), `stone-500` (secondary).
- Accent (buttons, links, focus rings, "왔음"/"present" status, "캠프" event type): `emerald-600`/`emerald-700`.
- Functional status colors (not part of the brand accent, kept distinct on purpose): attendance `absent` = red, `late` = amber, `excused` = gray; event type `field_trip` = sky blue, `other` = gray. Error text is always `red-600` regardless of theme.

## Data model (`supabase/migrations/`)

Nine tables across ten migrations:

1. `20260728121422_init_schema.sql` — `mentors`, `mentees`, `weekday_registrations`, `attendance`, `session_logs`.
2. `20260728125543_tighten_rls_mentor_scope.sql` — closes an RLS gap (see below).
3. `20260728143715_add_attendance_reason.sql` — adds `attendance.reason`.
4. `20260728145946_add_center_events.sql` — adds `center_events` + `center_event_type` enum.
5. `20260729124812_add_center_event_schedule_and_photos.sql` — adds `center_events.schedule` and `center_events.photo_urls`.
6. `20260730134002_add_classes.sql` — adds `classes` (shared, like `center_events`) + `class_enrollments` (mentee↔class, mentor-scoped like `session_logs`).
7. `20260730142008_add_class_cancellations.sql` — adds `class_cancellations`, per-date exceptions to a class's weekly recurrence.
8. `20260730144602_add_attendance_delete_policy.sql` — adds the missing `attendance` DELETE policy (mentor-scoped, same shape as its UPDATE policy).
9. `20260730145338_add_class_color.sql` — adds `classes.color` (`class_color` enum) for per-class calendar dots.
10. `20260801120000_add_session_log_progress.sql` — adds `session_logs.progress`.

### Tables

- **`mentors`** — one row per mentor, `id` = `auth.users.id`. Auto-created by a trigger (`handle_new_mentor`) on signup.
- **`mentees`** — the kids. `name`, `birth_date`, `school`, `grade`, `guardian_contact`, `notes`.
- **`weekday_registrations`** — `(mentee_id, mentor_id, day_of_week)`, `day_of_week` is `0`(Sun)–`6`(Sat). This is how a mentee gets associated with a mentor — there is no `mentee.mentor_id` column. **This table is the source of truth for "which mentor owns which mentee"**; every scoped RLS policy below is expressed in terms of it. No UI writes to this table yet (see Roadmap) — seed it directly via the Supabase SQL editor.
- **`attendance`** — one row per `(mentee_id, session_date)` (unique constraint), `status` is the `attendance_status` enum (`present` / `absent` / `late` / `excused`), optional `reason` text (used for `late` and `excused`), optional link back to the `weekday_registration` it fulfills.
- **`session_logs`** — mentor's freeform write-up per `(mentee_id, session_date)`, optional `subject` (free text, quick-picked from `COMMON_SUBJECTS` in `src/lib/subjects.ts` via a datalist so it stays consistent enough to group by), optional `progress` (short freeform text like "문제집 45~52p", read by the subject-summary aggregation on the mentee page — see below), optional link to an `attendance` row. This is the table the future AI analysis will read across time per mentee.
- **`classes`** — center-run classes (외부 강사 수업), shared like `center_events`: `name`, `day_of_week`, `teacher_name`, `description`, `color` (`class_color` enum, for calendar dots). `class_enrollments` is the mentee↔class join table, mentor-scoped like `session_logs`/`attendance`. `class_cancellations` holds per-date exceptions to a class's weekly recurrence.
- **`center_events`** — `title`, `event_type` (enum: `field_trip` / `camp` / `other`), `start_date`/`end_date` (multi-day ranges, `end_date >= start_date` check), `location`, `description` (short blurb), `schedule` (longer freeform itinerary text), `photo_urls` (`text[]`, defaults `{}` — **column exists but there is no upload UI or Storage bucket wired up yet**), `created_by` (nullable, `on delete set null`, not used in RLS — just informational).

### RLS summary

- **`mentees`, `attendance`, `session_logs`** are mentor-scoped through `weekday_registrations`: a mentor can only SELECT a mentee (and that mentee's attendance/session_logs) if a `weekday_registrations` row links that mentee to `auth.uid()`. `attendance`/`session_logs` INSERT/UPDATE additionally require `mentor_id = auth.uid()` **and** that same assignment check — a mentor can't log or mark attendance for someone else's mentee even knowing the mentee's id. `session_logs` DELETE is `mentor_id = auth.uid()` only.
- **`mentees` INSERT** is open to any authenticated mentor (creating a mentee record doesn't assign a mentor by itself — that happens separately via `weekday_registrations`). A mentor who creates a mentee but hasn't added a `weekday_registrations` row for themselves won't be able to see it again until they do. There's no mentee-creation UI yet — add rows via the Supabase dashboard when testing.
- **`weekday_registrations`**: a mentor can only see/insert/update/delete their own assignment rows (`mentor_id = auth.uid()`), not other mentors' schedules.
- **`center_events`**, **`classes`**, **`class_cancellations`** are deliberately **not** scoped like the tables above — full shared CRUD (`using (true)` / `with check (true)`) for any authenticated mentor on select/insert/update/delete, since they're center-wide, not per-mentor data. Don't copy the `weekday_registrations`-based scoping pattern onto these tables.
- **`class_enrollments`** is mentor-scoped the same way as `session_logs`/`attendance`: a mentor can only see/insert/delete enrollment rows for mentees assigned to them via `weekday_registrations`.
- Revisit the mentor-scoped model if the center grows to multiple independent branches, or if mentees can be reassigned away from a mentor who should keep historical read access to logs they wrote.

## Roadmap (not yet built)

- **Mentee creation / weekday-registration UI** — both are currently seeded by hand via the Supabase dashboard/SQL editor.
- **Photo upload for center events** — `center_events.photo_urls` column exists (`text[]`), but there's no Supabase Storage bucket, upload UI, or display of photos on the event detail page yet.
- **AI analysis over `session_logs`** — weakness detection and next-session suggestions per mentee, reading across a mentee's full history. Will need a service-role or edge-function path since it must read across all mentors' logs for a mentee, not just the acting mentor's own (current RLS intentionally restricts a mentor to their own assigned mentees).
