# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code(claude.ai/code)에게 제공하는 가이드입니다.

@AGENTS.md

## 이 프로젝트는 무엇인가

**saessak_diary**(새싹 다이어리)는 지역아동센터 멘토를 위한 멘토링 코파일럿 웹 앱입니다. "새싹"은 프로젝트 이름일 뿐이며, 아이들이 자라나는 것을 비유한 것이지 실제로 식물을 다루는 앱은 아닙니다.

- 멘토는 로그인해서 자신에게 배정된 멘티를 보고, 수업 일지를 쓰고, 멘티별 출석을 확인합니다.
- 센터는 또한 견학, 1박 캠프 같은 공용 행사를 운영하는데, 멘토-멘티 배정과 무관하게 모든 멘토가 하나의 공통 달력에서 볼 수 있습니다.
- 추후 AI가 누적된 수업 일지를 분석해 아이별 학습 취약점을 드러내고 다음 수업에서 집중할 부분을 제안할 예정입니다 — **아직 구현되지 않음** (로드맵 참고).

1단계(로그인 → 멘티 목록 → 수업 일지 작성 폼 → Supabase 저장)와 그 이후 진행된 출석/행사 달력 작업은 완료되었습니다. 남은 작업은 로드맵 항목에 정리되어 있습니다.

## ⚠️ Next.js 버전 주의사항

이 프로젝트는 App Router API가 학습 데이터에서 기대할 수 있는 것과 다른 Next.js 버전을 고정해서 씁니다 (`AGENTS.md` 참고). App Router 코드를 작성하기 전에 `node_modules/next/dist/docs/01-app/`에서 현재 API를 확인하세요. 이미 이 저장소에서 실제로 영향을 주고 있는 차이점 두 가지:

- **`middleware.ts`가 `proxy.ts`로 이름이 바뀌었고**, export하는 함수 이름도 `middleware`가 아니라 `proxy`여야 합니다 (또는 default export). `src/proxy.ts` 참고.
- **`next/headers`의 `cookies()`는 비동기 함수입니다** — 항상 `await cookies()`로 호출하세요.

## 명령어

```bash
npm run dev          # 개발 서버 시작 (Turbopack), localhost:3000
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 빌드 실행
npm run lint         # eslint 실행
npx tsc --noEmit     # 타입체크
```

### Supabase (npx로 실행 — 전역 설치 없음)

이 프로젝트는 실제로 호스팅되는 Supabase 프로젝트와 연결되어 있습니다 (연결 상태는 `supabase/.temp/`에 있으며 gitignore 대상). 일반적인 스키마 변경 흐름:

```bash
npx supabase migration new <name>       # supabase/migrations에 새 마이그레이션 파일 생성
# ...생성된 .sql 파일을 편집...
npx supabase db push --linked --dry-run # 적용될 내용을 미리 점검 (dry-run)
npx supabase db push --linked           # 실제 호스팅 프로젝트에 적용
npx supabase migration list --linked    # 로컬 마이그레이션과 원격에 적용된 내용이 일치하는지 확인
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

**`gen types`는 반드시 Git Bash나 WSL에서 실행하고, Windows PowerShell 5.1에서는 절대 실행하지 마세요.** PowerShell의 `>` 리다이렉트는 기본적으로 UTF-16을 사용해서 생성된 파일을 조용히 깨뜨립니다 (모든 문자에 null byte가 패딩됨 — 이런 일이 생기면 `file src/lib/database.types.ts` 실행 시 `ASCII text` 대신 `UTF-16`이라고 나옵니다). 동료가 다시 생성한 뒤 TypeScript가 갑자기 `database.types.ts`를 파싱하지 못한다면 바로 이 문제이니, Bash에서 명령어를 다시 실행하면 됩니다.

`src/lib/database.types.ts`는 `src/lib/supabase/client.ts`와 `server.ts` 양쪽의 `createClient<Database>(...)`에 연결되어 있습니다 — 스키마가 바뀔 때마다 다시 생성하고, `npx tsc --noEmit`으로 업데이트가 필요한 호출부를 찾아내세요.

로컬 Supabase 스택(`npx supabase start`)은 Docker Desktop이 필요한데, 이 개발 환경에서는 사용할 수 없었습니다 — 그래서 지금까지의 모든 스키마 작업은 로컬 shadow DB 대신 연결된 호스팅 프로젝트에 바로 반영되었습니다.

앱을 실행하기 전에 `.env.example`을 `.env.local`로 복사하고, Supabase 프로젝트 설정(Settings → API)에서 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값을 채워 넣으세요.

## 아키텍처

- Next.js App Router, TypeScript, Tailwind v4, `src/` 레이아웃. 경로 별칭 `@/*` → `./src/*`.
- Supabase(Postgres + Auth)가 백엔드 전체입니다 — 별도 API 서버는 없습니다. 데이터 접근은 커스텀 REST/GraphQL 레이어가 아니라 Supabase 클라이언트 헬퍼를 통해 이루어집니다.
- 인증 세션 갱신은 `src/proxy.ts`에서 이루어지며(`src/lib/supabase/proxy.ts`의 `updateSession`을 통해), 경로가 `/login`이나 `/auth` 하위가 아니면 인증되지 않은 요청을 `/login`으로 리다이렉트하는 역할도 합니다. 새로운 공개 경로는 `src/lib/supabase/proxy.ts`의 `PUBLIC_PATHS`에 추가하세요.
- Supabase 클라이언트 진입점은 세 가지이며, 각각 실행 컨텍스트가 다릅니다 — 코드가 실행되는 위치에 맞는 것을 항상 사용하세요:
  - `src/lib/supabase/client.ts` — 브라우저/클라이언트 컴포넌트용 (`createBrowserClient`).
  - `src/lib/supabase/server.ts` — 서버 컴포넌트, 서버 액션, 라우트 핸들러용 (`createServerClient`, 비동기 — `await cookies()`로 쿠키를 읽음).
  - `src/lib/supabase/proxy.ts` — proxy 전용 세션 갱신, `NextRequest`/`NextResponse`의 쿠키 저장소를 직접 다룹니다.
- 데이터 변경은 클라이언트 측 fetch + 라우트 핸들러가 아니라 서버 액션(`'use server'`)으로 처리합니다. 모든 서버 액션은 각자 독립적으로 인증을 다시 확인합니다(`supabase.auth.getUser()`) — 폼이 인증된 페이지에서만 접근 가능하다고 믿지 마세요. 액션은 하나의 공유 파일이 아니라, 그것을 사용하는 라우트 옆에 둡니다 (예: `src/app/mentees/[menteeId]/actions.ts`, `src/app/events/[eventId]/actions.ts`).
- 페이지 이동 없이 현재 화면을 갱신해야 하는 변경 작업 후에는 `revalidatePath(...)`(`next/cache`, 액션 응답의 일부로 재렌더링이 트리거됨)를 호출하거나, `<form>`이 아니라 `onClick`에서 바로 호출하는 액션이라면 `refresh()`(역시 `next/cache`)를 호출하세요 — `refresh()` 패턴은 `src/app/mentees/[menteeId]/attendance/actions.ts`를 참고하세요.

### 라우트

| 라우트 | 설명 |
| --- | --- |
| `/login` | 이메일/비밀번호 로그인 (Supabase Auth), `/auth/*` 외에 유일한 공개 라우트 |
| `/` | 홈 대시보드: 오늘 날짜, 내 멘티 수, 이번 주 센터 행사 건수, `/mentees`와 `/events`로 가는 링크 |
| `/mentees` | 로그인한 멘토에게 배정된 멘티 목록 (RLS가 필터링을 처리 — 쿼리에 별도 join 불필요) |
| `/mentees/[menteeId]` | 수업 일지 작성 폼(날짜, 과목, 진도, 내용) + 해당 멘티 일지의 월간 달력(일지가 있는 날에 점 표시, 날짜 클릭 시 그날 일지 확인) + 과목별 학습 현황 표(과목별 마지막 학습일/경과일수/최근 진도, 14일 이상이면 방치 경고 — `subject-summary.tsx` 참고) + 전체 일지 목록(시간순) |
| `/mentees/[menteeId]/attendance` | 출석 전용 별도 월간 달력. 날짜 클릭 → 출석/결석/지각/사유결석 버튼; 지각/사유결석 선택 시 사유 입력란 노출(`attendance.reason`에 저장); 같은 날짜를 다시 클릭하면 저장된 상태를 다시 불러옴 |
| `/events` | 센터 전체 행사 달력(견학, 캠프), 멘티 배정과 무관하게 모든 멘토가 공유. 날짜 클릭 시 그날의 행사를 보거나 추가 |
| `/events/[eventId]` | 행사 상세 — 인라인 보기 ↔ 수정 전환과 삭제(확인 다이얼로그 후 `/events`로 리다이렉트) 지원 |
| `/schedule` | 센터 주간 시간표 (월~금 × 09:00~20:00), `schedule/page.tsx`에 하드코딩됨 — 아직 `center_schedule` 테이블이 없어서 편집 UI가 만들어지기 전까지는 표시 전용 |

### 달력 UI 패턴 (react-day-picker)

서로 다른 세 개의 달력(`log-calendar.tsx`, `mentees/[menteeId]/attendance/attendance-calendar.tsx`, `events/events-calendar.tsx`)은 모두 같은 형태를 따릅니다: `DayPicker`에 `modifiers` 맵(카테고리별 날짜 배열)과 `modifiersClassNames`를 사용하고, 날짜 색칠은 Tailwind 클래스가 아니라 `globals.css`의 순수 CSS로 처리합니다. `modifiersClassNames`는 날짜 셀에 클래스 이름을 붙이는 것만 해줄 뿐이라, 실제 스타일링은 그 클래스 아래 `.rdp-day_button`을 대상으로 하는 순수 CSS로 해야 하기 때문입니다 (예: `.att-present .rdp-day_button { background-color: ...; }`). react-day-picker가 `.rdp-root` 자체에 설정하는 값(`--rdp-accent-color` 같은)을 덮어쓸 때는, 선택자를 두 번 반복하는 트릭 `.rdp-root.rdp-root { ... }`을 써서 명시도(specificity)로 이기세요 — 그렇지 않으면 `globals.css`와 `react-day-picker/style.css`의 예측 불가능한 CSS import 순서에 따라 결과가 달라집니다.

여러 날에 걸친 기간(행사의 `start_date`~`end_date`)은 그 범위의 모든 날짜를 같은 modifier 배열에 넣어서 표현합니다 — 실제로 "이어진 막대" 형태로 렌더링하는 건 아니고, 같은 색 동그라미가 연속으로 이어져서 마치 연결된 것처럼 보이는 방식입니다.

`src/components/date-picker.tsx`는 재사용 가능한 팝오버형 단일 날짜 선택기입니다(버튼 + 절대 위치로 뜨는 패널 안의 `DayPicker`, 바깥 클릭 시 닫힘). 폼에 날짜 필드가 필요한 곳이면 어디서든 사용됩니다 — 수업 일지 날짜, 출석 날짜 선택 컨텍스트, 행사 시작/종료일 등.

### 한국 공휴일 데이터 (`src/lib/holidays.ts`)

`KOREAN_HOLIDAYS`는 손으로 직접 관리하는 `{ "YYYY-MM-DD": "홀리데이 이름" }` 형태의 맵이며, 현재 **2025~2027년**을 다룹니다. 라이브러리나 API 호출이 아니라 순수 데이터 파일로 만든 건 의도적인데, 음력 공휴일(설날, 추석, 부처님오신날)과 대체공휴일 규칙은 어차피 음력 달력 테이블 없이는 계산할 수 없고, 이 앱은 단일 센터용 내부 도구라서 공휴일 조회를 위한 API 키 + 네트워크 의존성을 두는 게 그만한 가치보다 더 취약하기 때문입니다. `isCenterClosed(date)`(주말 또는 공휴일)와 `getHolidayName(date)`는 `classes/class-calendar.tsx`와 `mentees/[menteeId]/attendance/attendance-calendar.tsx`에서 운영하지 않는 날을 회색으로 표시하고 그 날의 수업/출석 입력을 숨기는 데 사용됩니다.

**매년 12월에 한 번씩 갱신하세요**, 정부가 다음 해 달력(관공서의 공휴일에 관한 규정)을 발표하면 — 또는 `KOREAN_HOLIDAYS`에 "다음 해" 항목이 더 이상 없다면 그보다 먼저요. 추가하기 전에 최소 두 개의 독립된 출처로 날짜를 교차 확인하세요("OOOO년 대한민국 공휴일 대체공휴일"로 검색 — 음력 공휴일과 대체공휴일 날짜는 기억만으로 미묘하게 틀리기 쉽습니다; 이 목록은 학습 데이터가 아니라 웹 검색 + 여러 공휴일 달력 사이트를 교차 확인해서 만들었습니다). 의도적으로 제외한 것: 근로자의 날과 제헌절 — 둘 다 관공서 공휴일이 아니라서 센터/학교가 쉬지 않습니다.

### 색상 테마 ("새싹 그린")

라이트 테마 하나만 사용하며 다크 모드는 없습니다 (`src/` 어디에도 `dark:` 클래스가 없음 — 시스템 다크 모드 설정이 여기서 배경을 검게 강제하는 문제가 있어서 제거했습니다). 팔레트:

- 배경/카드: `stone-50`(페이지) / `white`(카드) / `stone-200`(테두리).
- 텍스트: `stone-900`(제목/본문), `stone-500`(보조).
- 강조색(버튼, 링크, 포커스 링, "왔음"/present 출석 상태, "캠프" 행사 종류): `emerald-600`/`emerald-700`.
- 기능적 상태 색상(브랜드 강조색에 속하지 않으며 의도적으로 구분): 출석 `absent`(결석) = 빨강, `late`(지각) = 호박색, `excused`(사유결석) = 회색; 행사 종류 `field_trip`(견학) = 하늘색, `other`(기타) = 회색. 에러 텍스트는 테마와 무관하게 항상 `red-600`.

## 데이터 모델 (`supabase/migrations/`)

열 개의 마이그레이션에 걸쳐 아홉 개의 테이블이 있습니다:

1. `20260728121422_init_schema.sql` — `mentors`, `mentees`, `weekday_registrations`, `attendance`, `session_logs`.
2. `20260728125543_tighten_rls_mentor_scope.sql` — RLS 허점을 막음 (아래 참고).
3. `20260728143715_add_attendance_reason.sql` — `attendance.reason` 추가.
4. `20260728145946_add_center_events.sql` — `center_events`와 `center_event_type` enum 추가.
5. `20260729124812_add_center_event_schedule_and_photos.sql` — `center_events.schedule`과 `center_events.photo_urls` 추가.
6. `20260730134002_add_classes.sql` — `classes`(`center_events`처럼 공유) + `class_enrollments`(멘티↔수업, `session_logs`처럼 멘토 범위 제한) 추가.
7. `20260730142008_add_class_cancellations.sql` — `class_cancellations` 추가, 수업의 주간 반복 일정에 대한 날짜별 예외.
8. `20260730144602_add_attendance_delete_policy.sql` — 빠져 있던 `attendance` DELETE 정책 추가 (멘토 범위 제한, UPDATE 정책과 동일한 형태).
9. `20260730145338_add_class_color.sql` — 수업별 달력 점 표시를 위한 `classes.color`(`class_color` enum) 추가.
10. `20260801120000_add_session_log_progress.sql` — `session_logs.progress` 추가.

### 테이블

- **`mentors`** — 멘토당 한 행, `id` = `auth.users.id`. 가입 시 트리거(`handle_new_mentor`)로 자동 생성됨.
- **`mentees`** — 아이들. `name`, `birth_date`, `school`, `grade`, `guardian_contact`, `notes`.
- **`weekday_registrations`** — `(mentee_id, mentor_id, day_of_week)`, `day_of_week`는 `0`(일)~`6`(토). 멘티가 멘토와 연결되는 방식이 바로 이것입니다 — `mentee.mentor_id` 컬럼은 따로 없습니다. **"어느 멘토가 어느 멘티를 담당하는가"에 대한 단일 진실 공급원(source of truth)이 바로 이 테이블**이며, 아래의 범위 제한 RLS 정책들은 모두 이 테이블을 기준으로 표현됩니다. 아직 이 테이블에 쓰는 UI는 없고(로드맵 참고) Supabase SQL 에디터로 직접 데이터를 넣습니다.
- **`attendance`** — `(mentee_id, session_date)`당 한 행(고유 제약), `status`는 `attendance_status` enum(`present`/`absent`/`late`/`excused`), 선택적으로 `reason` 텍스트(`late`, `excused`에 사용), 이 출석이 어느 `weekday_registration`을 충족하는지 가리키는 선택적 링크.
- **`session_logs`** — `(mentee_id, session_date)`당 멘토가 자유롭게 작성하는 기록, 선택적으로 `subject`(자유 텍스트지만 `src/lib/subjects.ts`의 `COMMON_SUBJECTS`에서 datalist로 빠르게 고를 수 있어 그룹화할 만큼은 일관성을 유지함), 선택적으로 `progress`(짧은 자유 텍스트, 예: "문제집 45~52p", 멘티 페이지의 과목별 학습 현황 집계에서 읽음 — 아래 참고), `attendance` 행에 대한 선택적 링크. 앞으로 AI 분석이 멘티별로 시간에 걸쳐 읽어들일 테이블입니다.
- **`classes`** — 센터에서 운영하는 수업(외부 강사 수업), `center_events`처럼 공유: `name`, `day_of_week`, `teacher_name`, `description`, `color`(달력 점 표시용 `class_color` enum). `class_enrollments`는 멘티↔수업 조인 테이블이며 `session_logs`/`attendance`처럼 멘토 범위로 제한됩니다. `class_cancellations`는 수업의 주간 반복 일정에 대한 날짜별 예외를 담습니다.
- **`center_events`** — `title`, `event_type`(enum: `field_trip`/`camp`/`other`), `start_date`/`end_date`(여러 날에 걸친 범위, `end_date >= start_date` 체크), `location`, `description`(짧은 소개), `schedule`(더 긴 자유 형식 일정 텍스트), `photo_urls`(`text[]`, 기본값 `{}` — **컬럼은 있지만 아직 업로드 UI나 Storage 버킷은 연결되어 있지 않음**), `created_by`(nullable, `on delete set null`, RLS에는 사용되지 않고 그냥 정보성).

### RLS 요약

- **`mentees`, `attendance`, `session_logs`**는 `weekday_registrations`를 통해 멘토 범위로 제한됩니다: `weekday_registrations` 행이 해당 멘티를 `auth.uid()`와 연결해줄 때만 멘토가 그 멘티(와 그 멘티의 attendance/session_logs)를 SELECT할 수 있습니다. `attendance`/`session_logs`의 INSERT/UPDATE는 추가로 `mentor_id = auth.uid()`**와** 동일한 배정 확인을 요구합니다 — 멘티 id를 알고 있어도 다른 멘토의 멘티에 대해 일지를 쓰거나 출석을 표시할 수 없습니다. `session_logs`의 DELETE는 `mentor_id = auth.uid()`만 확인합니다.
- **`mentees` INSERT**는 인증된 멘토라면 누구나 가능합니다(멘티 레코드를 만드는 것 자체는 멘토를 배정하지 않으며, 그건 `weekday_registrations`를 통해 별도로 이루어집니다). 멘티를 만들었지만 자기 자신의 `weekday_registrations` 행을 추가하지 않은 멘토는 그 행을 추가하기 전까지 다시 볼 수 없습니다. 아직 멘티 생성 UI는 없으니 테스트할 때는 Supabase 대시보드로 행을 추가하세요.
- **`weekday_registrations`**: 멘토는 자기 자신의 배정 행만(`mentor_id = auth.uid()`) 보고/추가하고/수정하고/삭제할 수 있으며, 다른 멘토의 일정은 볼 수 없습니다.
- **`center_events`**, **`classes`**, **`class_cancellations`**는 의도적으로 위 테이블들처럼 범위 제한을 **하지 않습니다** — select/insert/update/delete 모두 인증된 멘토라면 누구나 완전히 공유하는 CRUD(`using (true)` / `with check (true)`)입니다. 이들은 멘토별 데이터가 아니라 센터 전체 데이터이기 때문입니다. `weekday_registrations` 기반의 범위 제한 패턴을 이 테이블들에 그대로 적용하지 마세요.
- **`class_enrollments`**는 `session_logs`/`attendance`와 같은 방식으로 멘토 범위 제한이 걸려 있습니다: 멘토는 `weekday_registrations`를 통해 자신에게 배정된 멘티의 수강 신청 행만 보고/추가하고/삭제할 수 있습니다.
- 센터가 여러 개의 독립된 지점으로 확장되거나, 멘티가 다른 멘토에게 재배정되면서도 기존 멘토가 자신이 작성한 일지에 대한 읽기 권한은 유지해야 하는 상황이 생긴다면 이 멘토 범위 제한 모델을 다시 검토하세요.

## 로드맵 (아직 만들지 않음)

- **멘티 생성 / 요일 배정 UI** — 둘 다 현재는 Supabase 대시보드/SQL 에디터로 직접 입력합니다.
- **센터 행사 사진 업로드** — `center_events.photo_urls` 컬럼(`text[]`)은 있지만, 아직 Supabase Storage 버킷도, 업로드 UI도, 행사 상세 페이지에서 사진을 보여주는 기능도 없습니다.
- **`session_logs`에 대한 AI 분석** — 멘티별 전체 이력을 읽어서 취약점을 찾아내고 다음 수업 제안을 만듭니다. 실행 중인 멘토 본인의 것만이 아니라 해당 멘티에 대한 모든 멘토의 일지를 읽어야 하므로 service-role이나 edge function 경로가 필요할 것입니다 (현재 RLS는 의도적으로 멘토를 자신에게 배정된 멘티로만 제한합니다).
