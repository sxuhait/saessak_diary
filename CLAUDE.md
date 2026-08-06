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
| `/` | 홈 대시보드: 오늘 날짜, 전체 멘티 수, 이번 주 센터 행사 건수, `/mentees`와 `/events`로 가는 링크 |
| `/mentees` | 센터 전체 멘티 명단(공용, 담당 배정 없음 — RLS는 로그인 + 만료되지 않은 계정인지만 확인, 쿼리에 별도 join 불필요) |
| `/mentees/[menteeId]` | 수업 일지 작성 폼(날짜, 과목, 진도, 내용) + 해당 멘티 일지의 월간 달력(일지가 있는 날에 점 표시, 날짜 클릭 시 그날 일지 확인) + 과목별 학습 현황 표(과목별 마지막 학습일/경과일수/최근 진도, 14일 이상이면 방치 경고 — `subject-summary.tsx` 참고) + 전체 일지 목록(시간순, 각 일지에 "작성 멘토" 표시) |
| `/mentees/[menteeId]/attendance` | 출석 전용 별도 월간 달력. 날짜 클릭 → 출석/결석/지각/사유결석 버튼; 지각/사유결석 선택 시 사유 입력란 노출(`attendance.reason`에 저장); 같은 날짜를 다시 클릭하면 저장된 상태를 다시 불러옴 |
| `/classes` | 센터 수업(외부 강사) 관리. 목록/달력은 모든 로그인 사용자가 보지만, 새 수업 추가·수정·삭제는 `role = 'admin'`만 가능(서버 액션 + RLS 이중 체크, `classes/page.tsx`가 역할을 조회해 `isAdmin`을 `NewClassForm`/`ClassList`에 내려줌). 이번 주 휴강 처리(`class_cancellations`)는 관리자 제한 없이 모든 로그인 사용자가 가능 — 카탈로그 관리가 아니라 그날그날의 운영이라 별도로 다룸 |
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

열두 개의 마이그레이션에 걸쳐 여덟 개의 테이블이 있습니다:

1. `20260728121422_init_schema.sql` — `mentors`, `mentees`, `weekday_registrations`, `attendance`, `session_logs`.
2. `20260728125543_tighten_rls_mentor_scope.sql` — RLS 허점을 막음 (역사적 기록 — 이후 12번 마이그레이션에서 멘토 범위 제한 자체가 다시 제거됩니다).
3. `20260728143715_add_attendance_reason.sql` — `attendance.reason` 추가.
4. `20260728145946_add_center_events.sql` — `center_events`와 `center_event_type` enum 추가.
5. `20260729124812_add_center_event_schedule_and_photos.sql` — `center_events.schedule`과 `center_events.photo_urls` 추가.
6. `20260730134002_add_classes.sql` — `classes`(`center_events`처럼 공유) + `class_enrollments`(멘티↔수업) 추가.
7. `20260730142008_add_class_cancellations.sql` — `class_cancellations` 추가, 수업의 주간 반복 일정에 대한 날짜별 예외.
8. `20260730144602_add_attendance_delete_policy.sql` — 빠져 있던 `attendance` DELETE 정책 추가.
9. `20260730145338_add_class_color.sql` — 수업별 달력 점 표시를 위한 `classes.color`(`class_color` enum) 추가.
10. `20260801120000_add_session_log_progress.sql` — `session_logs.progress` 추가.
11. `20260806120000_add_mentor_role_and_expiration.sql` — `mentors.role`(`mentor_role` enum)과 `mentors.reactivated_at` 추가, 봉사자 만료 판단 함수 3종 추가, 멘토 범위 제한 RLS 정책 전체에 만료 체크 추가 (아래 "역할과 봉사자 만료" 참고).
12. `20260806130000_shared_mentee_roster_and_class_admin.sql` — **"담당 멘토" 개념 제거**: `mentees`/`attendance`/`session_logs`/`class_enrollments`의 멘토 범위 제한 RLS를 `center_events`와 같은 완전 공유 모델로 전환하고, 더 이상 쓸모없어진 `weekday_registrations` 테이블(과 `attendance.weekday_registration_id` 컬럼)을 삭제. `public.current_mentor_role()` 함수를 추가하고 `classes`의 insert/update/delete를 `role = 'admin'` 전용으로 제한 (아래 "공용 멘티 명단" 참고).

### 테이블

- **`mentors`** — 멘토당 한 행, `id` = `auth.users.id`. 가입 시 트리거(`handle_new_mentor`)로 자동 생성됨. `role`(`mentor_role` enum: `mentor`/`volunteer`/`admin`, 기본값 `mentor`)과 `reactivated_at`(nullable, 관리자가 봉사자를 재활성화할 때 채우는 타임스탬프)도 여기 있습니다 — 아래 "역할과 봉사자 만료" 참고.
- **`mentees`** — 아이들. `name`, `birth_date`, `school`, `grade`, `guardian_contact`, `notes`. **담당 멘토라는 개념이 없습니다** — 센터의 모든 로그인 사용자가 전체 명단을 공유해서 봅니다.
- **`attendance`** — `(mentee_id, session_date)`당 한 행(고유 제약), `status`는 `attendance_status` enum(`present`/`absent`/`late`/`excused`), 선택적으로 `reason` 텍스트(`late`, `excused`에 사용). `mentor_id`는 이 출석을 누가 기록했는지 나타내는 정보성 컬럼일 뿐, 접근 제어에는 쓰이지 않습니다(`center_events.created_by`와 같은 역할).
- **`session_logs`** — `(mentee_id, session_date)`당 자유롭게 작성하는 기록, 선택적으로 `subject`(자유 텍스트지만 `src/lib/subjects.ts`의 `COMMON_SUBJECTS`에서 datalist로 빠르게 고를 수 있어 그룹화할 만큼은 일관성을 유지함), 선택적으로 `progress`(짧은 자유 텍스트, 예: "문제집 45~52p", 멘티 페이지의 과목별 학습 현황 집계에서 읽음 — 아래 참고), `attendance` 행에 대한 선택적 링크. `mentor_id`는 이 일지를 누가 썼는지("작성 멘토", UI에 표시됨)를 나타내는 정보성 컬럼입니다 — insert 시점에 작성자로 고정되며, 다른 사용자가 나중에 내용을 수정해도 바뀌지 않습니다. 앞으로 AI 분석이 멘티별로 시간에 걸쳐 읽어들일 테이블입니다.
- **`classes`** — 센터에서 운영하는 수업(외부 강사 수업): `name`, `day_of_week`, `teacher_name`, `description`, `color`(달력 점 표시용 `class_color` enum). 조회는 모두에게 열려 있지만 추가/수정/삭제는 관리자 전용입니다(아래 "공용 멘티 명단" 참고). `class_enrollments`는 멘티↔수업 조인 테이블, 완전 공유. `class_cancellations`는 수업의 주간 반복 일정에 대한 날짜별 예외이며 관리자 제한 없이 완전 공유(카탈로그 관리가 아니라 그날그날의 운영이라 관리자 제한 대상이 아닙니다).
- **`center_events`** — `title`, `event_type`(enum: `field_trip`/`camp`/`other`), `start_date`/`end_date`(여러 날에 걸친 범위, `end_date >= start_date` 체크), `location`, `description`(짧은 소개), `schedule`(더 긴 자유 형식 일정 텍스트), `photo_urls`(`text[]`, 기본값 `{}` — **컬럼은 있지만 아직 업로드 UI나 Storage 버킷은 연결되어 있지 않음**), `created_by`(nullable, `on delete set null`, RLS에는 사용되지 않고 그냥 정보성).

`weekday_registrations`는 더 이상 존재하지 않습니다 — 이전에는 "어느 멘토가 어느 멘티를 담당하는가"의 단일 진실 공급원이었지만, 이 센터는 담당제를 쓰지 않는 것으로 확인되어 12번 마이그레이션에서 테이블 자체와 `attendance.weekday_registration_id` FK 컬럼을 함께 삭제했습니다. 애플리케이션 코드 어디에서도 참조하지 않던 테이블이라(SQL 에디터로 수동 입력하는 용도 외에는 UI 없음) 다른 의미로 재활용하지 않고 정리했습니다.

### 공용 멘티 명단과 역할 기반 권한

- **`mentees`, `attendance`, `session_logs`, `class_enrollments`는 완전히 공유됩니다** — `center_events`/`classes` 조회와 동일한 모델로, 로그인했고(그리고 봉사자라면 만료되지 않은) 사용자라면 누구나 전체 멘티 명단·출석·일지·수강 정보를 보고 쓸 수 있습니다. `attendance`/`session_logs`의 INSERT는 `mentor_id = auth.uid()`로 작성자를 고정하지만, SELECT/UPDATE/DELETE에는 어떤 배정/작성자 조건도 없습니다 — 이미 써진 기록도 아무나 고칠 수 있습니다(동료의 오타를 고치는 것 같은 상황을 막지 않으려는 의도). 모든 쓰기(insert/update/delete)에는 `not public.current_mentor_blocked()`가 붙어 만료된 봉사자를 막습니다.
- **`classes`는 조회만 완전 공유이고, insert/update/delete는 `role = 'admin'`만 가능합니다.** `public.current_mentor_role() returns mentor_role`(RLS에서 호출하는 `security definer`가 아닌 일반 함수 — 호출자 자신의 `mentors` 행은 이미 "mentors can view their own profile" 정책으로 읽을 수 있으므로 필요 없음)로 판단합니다. 애플리케이션 레벨에서도 이중으로 막습니다: `src/app/classes/actions.ts`의 `createClass`/`updateClass`/`deleteClass`가 각각 `mentors.role`을 조회해 `admin`이 아니면 한국어 에러를 반환하고, `src/app/classes/page.tsx`가 역할을 조회해 `isAdmin`을 `NewClassForm`/`ClassList`에 내려줘서 비관리자에게는 추가/수정/삭제 UI 자체를 숨깁니다. `class_cancellations`(이번 주 휴강 처리)는 이 제한에서 제외되어 있습니다 — 카탈로그 자체를 바꾸는 게 아니라 매주 운영하는 성격이라 모든 로그인 사용자가 계속 할 수 있습니다.
- **`center_events`, `class_cancellations`**는 여전히 범위 제한이나 role 제한이 전혀 없는 완전 공유 CRUD(`using (true)` / `with check (true)`)입니다. **만료 체크도 이 테이블들의 RLS에는 걸려 있지 않습니다** — 대신 `proxy.ts`가 만료된 봉사자의 페이지 접근 자체를 전부 막으므로 앱 레벨에서는 여전히 차단됩니다.
- 센터가 여러 개의 독립된 지점으로 확장되어 지점별로 멘티를 분리해야 하는 상황이 생긴다면 이 완전 공유 모델을 다시 검토하세요.

### 역할과 봉사자 만료

- 세 가지 역할: `mentor`(멘토), `volunteer`(봉사자), `admin`(관리자). 멘토와 봉사자는 로그인 후 화면/기능이 완전히 동일합니다 — 역할은 오직 봉사자 만료 로직에만 쓰입니다. 관리자 역할은 회원가입 화면에서 선택할 수 없고(가입 폼은 `mentor`/`volunteer`만 허용, `handle_new_mentor` 트리거가 그 외 값은 전부 `mentor`로 강등시킵니다), 지정하려면 SQL로 직접 `update mentors set role = 'admin' where id = '<uuid>'`를 실행해야 합니다. 관리자 전용 화면은 아직 없습니다.
- 봉사자 만료 규칙: 마지막 활동(자신이 작성한 `session_logs`/`attendance` 행 중 가장 최근 `created_at`, 없으면 `mentors.created_at` 가입일) 후 30일이 지나면 접근이 막힙니다. 판단 로직은 세 함수로 분리되어 있습니다 (`supabase/migrations/20260806120000_add_mentor_role_and_expiration.sql`):
  - `public.mentor_last_activity(p_mentor_id uuid) returns timestamptz` — 마지막 활동 시각 계산 (`session_logs`/`attendance` 최댓값, `mentors.reactivated_at`, `mentors.created_at` 중 가장 늦은 값).
  - `public.is_volunteer_expired(p_mentor_id uuid) returns boolean` — 임의의 멘토 id에 대해 만료 여부 판단. 재사용 가능하도록 분리되어 있어 나중에 관리자 화면/배치 작업에서 그대로 호출할 수 있습니다.
  - `public.current_mentor_blocked() returns boolean` — `is_volunteer_expired(auth.uid())`의 래퍼, RLS 정책과 RPC 호출에서 편하게 쓰기 위한 것.
  - 세 함수 모두 `security definer`라 RLS를 우회해서 다른 멘토의 session_logs/attendance까지 읽을 수 있고, `execute` 권한은 `authenticated`로만 제한되어 있습니다(다른 멘토의 만료 여부를 익명으로 조회하지 못하도록).
- **관리자가 봉사자를 재활성화(기간 연장)하려면** `update mentors set reactivated_at = now() where id = '<uuid>'`를 실행하면 됩니다 — 실제 활동 기록이 없어도 이 시각부터 30일이 다시 주어집니다.
- 3중 방어: (1) 위 RLS 정책들, (2) `src/lib/supabase/proxy.ts`가 공개 경로가 아닌 모든 요청마다 `is_volunteer_expired` RPC를 호출해서 만료된 사용자를 로그아웃시키고 `/login?notice=expired`로 리다이렉트, (3) `src/app/login/actions.ts`의 `login` 액션이 비밀번호 확인 직후 같은 RPC로 재확인해서 만료된 계정은 즉시 로그아웃 후 에러 메시지를 보여줍니다. 세 곳 다 서버 사이드이며, 클라이언트에서 role을 보고 숨기는 방식이 아닙니다.

## 로드맵 (아직 만들지 않음)

- **멘티 생성 UI** — 현재는 Supabase 대시보드/SQL 에디터로 직접 입력합니다.
- **관리자 전용 화면** — 봉사자 재활성화(`mentors.reactivated_at`)와 역할 지정(`mentors.role = 'admin'`)은 아직 UI가 없고 SQL로만 가능합니다.
- **센터 행사 사진 업로드** — `center_events.photo_urls` 컬럼(`text[]`)은 있지만, 아직 Supabase Storage 버킷도, 업로드 UI도, 행사 상세 페이지에서 사진을 보여주는 기능도 없습니다.
- **`session_logs`에 대한 AI 분석** — 멘티별 전체 이력을 읽어서 취약점을 찾아내고 다음 수업 제안을 만듭니다. `session_logs` RLS가 이제 완전 공유라 클라이언트 세션으로도 모든 멘티의 전체 이력을 읽을 수 있으므로(더 이상 담당 배정으로 막혀 있지 않음), service-role/edge function이 필수는 아니지만 여전히 무거운 배치 작업이라면 분리하는 편이 나을 수 있습니다.
