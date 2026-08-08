import { PageHeader } from "@/components/ui/page-header";
import { cardClassName } from "@/components/ui/card";

// Static for now -- there's no `center_schedule` table yet, this is just the
// standard weekly template hardcoded until an edit UI exists (see Roadmap).
type ScheduleRow =
  | { time: string; type: "shared"; label: string }
  | { time: string; type: "byDay"; days: [string, string, string, string, string] };

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금"];

// One pastel per weekday column, reused only for this page's "요일별 수업"
// row -- kept separate from the class_color enum in class-colors.ts since
// that palette is tied to editable class records, not this static template.
const DAY_COLORS = [
  { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200" },
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
];

const SCHEDULE_ROWS: ScheduleRow[] = [
  { time: "09:00~12:00", type: "shared", label: "개관·자유활동" },
  { time: "12:00~13:00", type: "shared", label: "점심" },
  { time: "13:00~15:00", type: "shared", label: "자유활동·독서" },
  { time: "15:00~16:00", type: "shared", label: "간식·놀이" },
  {
    time: "16:00~17:30",
    type: "byDay",
    days: ["숙제지도", "영어수업", "연극수업", "미술수업", "독서수업"],
  },
  { time: "17:30~18:30", type: "shared", label: "저녁식사" },
  { time: "18:30~19:30", type: "shared", label: "멘토링" },
  { time: "19:30~20:00", type: "shared", label: "정리·하원" },
];

export default function SchedulePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <PageHeader
        backHref="/"
        backLabel="홈으로"
        title="센터 주간 시간표"
        description="운영시간 09:00~20:00 (월~금)"
      />

      <div className={`w-full overflow-x-auto ${cardClassName}`}>
        <table className="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-24 rounded-lg bg-emerald-50 px-2 py-2 text-left text-xs font-medium text-emerald-700">
                시간
              </th>
              {WEEKDAY_LABELS.map((label) => (
                <th
                  key={label}
                  className="rounded-lg bg-emerald-50 px-2 py-2 text-center text-xs font-medium text-emerald-700"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCHEDULE_ROWS.map((row) => (
              <tr key={row.time}>
                <td className="whitespace-nowrap rounded-lg bg-stone-50 px-2 py-3 text-xs font-medium text-stone-600">
                  {row.time}
                </td>
                {row.type === "shared" ? (
                  <td
                    colSpan={5}
                    className="rounded-lg border border-stone-200 bg-stone-50/60 px-2 py-3 text-center text-stone-700"
                  >
                    {row.label}
                  </td>
                ) : (
                  row.days.map((label, index) => {
                    const color = DAY_COLORS[index];
                    return (
                      <td
                        key={WEEKDAY_LABELS[index]}
                        className={`rounded-lg border px-2 py-3 text-center font-medium ${color.bg} ${color.text} ${color.border}`}
                      >
                        {label}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
