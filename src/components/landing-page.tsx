import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Sprout,
  NotebookPen,
  ClipboardCheck,
  TrendingUp,
  CalendarDays,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";

// Loaded only for this page's headings (applied via headingFont.className on
// each heading), not layout.tsx's global --font-heading -- matches the
// Stitch design spec (Plus Jakarta Sans) without changing the app's Nunito
// Sans heading font everywhere else.
const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700"],
});

type Tint = "green" | "yellow" | "blue";

const TINT_CLASSES: Record<Tint, string> = {
  green: "bg-sprout-tint text-sprout-deep",
  yellow: "bg-sun-tint text-sun-ink",
  blue: "bg-sky-tint text-sky-ink",
};

const FEATURES: { icon: typeof NotebookPen; title: string; description: string; tint: Tint }[] = [
  {
    icon: NotebookPen,
    title: "아이별 일지 작성",
    description:
      "과목별 학습 내용과 진도를 간편하게 기록하세요. 이전 기록을 빠르게 불러와 이어 적을 수 있습니다.",
    tint: "green",
  },
  {
    icon: ClipboardCheck,
    title: "출석 체크",
    description:
      "출석, 지각, 결석 사유까지 한 번에 관리합니다. 아이들의 참여도를 쉽게 파악할 수 있습니다.",
    tint: "yellow",
  },
  {
    icon: TrendingUp,
    title: "학습 현황 자동 정리",
    description:
      "결석 패턴이나 학습 편중을 규칙 기반으로 알려드립니다. 데이터에 기반한 세심한 지도가 가능해집니다.",
    tint: "blue",
  },
  {
    icon: CalendarDays,
    title: "센터 일정 관리",
    description:
      "행사, 수업, 주간 시간표를 놓치지 마세요. 모든 멘토가 함께 보는 하나의 캘린더로 관리합니다.",
    tint: "green",
  },
];

// Shown at "/" when nobody is logged in (src/app/page.tsx renders this
// instead of the dashboard); logged-in users never see it since that page
// checks auth before rendering either. Restyled to match a Stitch design
// mock (colors, card shapes, section layout) -- the sprout-*/sun-*/sky-*
// tokens it uses are defined in globals.css, kept separate from the
// emerald/stone tokens the rest of the app uses.
export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-canvas text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sprout-deep text-white">
            <Sprout className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className={`${headingFont.className} text-lg tracking-tight`}>
            새싹일기
          </span>
        </span>

        <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
          <a href="#hero" className="hover:text-sprout-deep">
            소개
          </a>
          <a href="#features" className="hover:text-sprout-deep">
            주요기능
          </a>
          <a href="#mission" className="hover:text-sprout-deep">
            미션
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-lg bg-sprout px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sprout-hover sm:px-5"
        >
          시작하기
        </Link>
      </header>

      <section
        id="hero"
        className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 pb-16 pt-10 text-center sm:px-6 sm:pb-24 sm:pt-14 lg:px-8"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-tint px-4 py-1.5 text-sm font-medium leading-5 text-sky-ink">
          멘토링을 더 쉽고 의미있게
        </span>

        <h1
          className={`${headingFont.className} max-w-2xl text-2xl leading-8 tracking-tight sm:text-3xl sm:leading-tight lg:text-display`}
        >
          지역아동센터 멘토를 위한
          <br className="hidden sm:block" />
          멘토링 기록 도구
        </h1>

        <p className="max-w-xl text-lg leading-7 text-gray-700">
          복잡한 기록은 줄이고, 아이들과의 시간에 집중하세요.
          <br className="hidden sm:block" />
          새싹일기가 당신의 다정한 멘토링 여정을 돕습니다.
        </p>

        <Link
          href="/login"
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sprout px-6 py-3 text-base font-semibold text-white shadow-sprout-cta hover:bg-sprout-hover"
        >
          시작하기
        </Link>

        {/* Placeholder product visual -- swap for a real screenshot at
            public/landing/hero.png (see chat for how to wire it in). */}
        <div className="mt-10 w-full max-w-4xl rounded-3xl bg-gradient-to-br from-sprout-tint via-white to-sky-tint p-6 shadow-sprout-lg sm:p-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-4 shadow-sprout-sm sm:p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sprout-deep text-white">
                    <Sprout className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                  </span>
                  <div className="h-2 w-24 rounded-full bg-outline-soft" />
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="h-2 w-full rounded-full bg-stone-100" />
                  <div className="h-2 w-4/5 rounded-full bg-stone-100" />
                  <div className="h-2 w-3/5 rounded-full bg-sprout" />
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-full bg-sprout-tint px-2.5 py-1 text-xs font-medium text-sprout-deep">
                    출석
                  </span>
                  <span className="rounded-full bg-sun-tint px-2.5 py-1 text-xs font-medium text-sun-ink">
                    일지
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center rounded-full bg-sprout-tint px-3.5 py-1 text-sm font-medium leading-5 text-sprout-deep">
            핵심 기능
          </span>
          <h2 className={`${headingFont.className} text-2xl leading-8 sm:text-headline`}>
            아이들의 성장을 한눈에
          </h2>
          <p className="text-base leading-6 text-gray-700">
            필요한 기능만 모아 담백하게 구성했습니다.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description, tint }) => (
            <div key={title} className={`flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sprout-sm sm:p-8`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${TINT_CLASSES[tint]}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-xl font-semibold leading-7">{title}</h3>
              <p className="text-base leading-6 text-gray-700">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="mission" className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl rounded-3xl bg-mist p-6 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-sun-tint px-3.5 py-1 text-sm font-medium leading-5 text-sun-ink">
                우리의 이야기
              </span>
              <h2 className={`${headingFont.className} mt-4 text-2xl leading-8 sm:text-headline`}>
                기록이 짐이 되지 않도록
              </h2>
              <p className="mt-4 text-lg leading-7 text-gray-700">
                지역아동센터 멘토들은 아이들을 가르치는 일 외에도 행정 업무와
                기록에 시달립니다. 담당 배정 없이 여러 멘토가 아이들을 함께
                돌보다 보니 기록은 흩어지기 쉽고, 손이 오래 못 미친 아이는
                알아채기 어려웠습니다. 새싹일기는 모든 멘토가 함께 보는 공용
                명단과 일지로 기록을 한 곳에 모으고, 방치·결석 패턴을
                자동으로 먼저 알려드립니다.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-sky-tint via-sprout-tint to-white p-10 shadow-sprout-md">
              <div className="mx-auto flex max-w-xs flex-col items-center gap-3 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft">
                  <HeartHandshake className="h-8 w-8 text-sprout-deep" strokeWidth={1.5} aria-hidden />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sprout-tint text-sprout-deep">
          <Sprout className="h-7 w-7" strokeWidth={2} aria-hidden />
        </span>
        <h2 className={`${headingFont.className} max-w-lg text-2xl leading-8 sm:text-headline`}>
          우리 센터 아이들을 위한 기록,
          <br className="hidden sm:block" />
          지금 시작해보세요.
        </h2>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg bg-sprout-deep px-6 py-3 text-base font-semibold text-white shadow-sprout-cta-deep hover:bg-sprout-deep-hover"
        >
          무료로 시작하기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <footer className="border-t border-outline-soft px-4 py-6 text-center text-sm leading-5 text-stone-500 sm:px-6 lg:px-8">
        <p className="font-semibold text-ink">새싹일기</p>
        <p className="mt-1">
          © {new Date().getFullYear()} 새싹일기 · 온새미로지역아동센터 멘토링 코파일럿
        </p>
      </footer>
    </div>
  );
}
