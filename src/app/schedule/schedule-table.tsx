import { CLASS_COLOR_CARD_CLASS } from "@/lib/class-colors";
import { cardClassName } from "@/components/ui/card";
import type { ScheduleItem } from "./schedule-manage-list";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금"];
const WEEKDAYS = [1, 2, 3, 4, 5];

function formatTime(value: string) {
  return value.slice(0, 5);
}

function contentSignature(item: ScheduleItem) {
  return `${item.title}|${item.subtitle ?? ""}|${item.color}`;
}

type TableRow = {
  key: string;
  start: string;
  end: string;
  // How many leading weekday columns (starting Monday) collapse into one
  // shared banner, because every one of them has exactly this one identical
  // item (same title/subtitle/color) -- e.g. "센터 OPEN 청소" on all 5 days,
  // or "주간 귀가지도" on 월~목. 0 means no merge for this row.
  mergedThrough: number;
  mergedItem: ScheduleItem | null;
  byDay: ScheduleItem[][];
};

// Groups the flat item list into the same shape the old hand-written
// SCHEDULE_ROWS table used: one row per distinct time range, with identical
// same-time items on a Monday-starting run of days collapsed into a single
// spanning banner cell instead of five separate identical-looking cells.
function buildRows(items: ScheduleItem[]): TableRow[] {
  const slots = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const key = `${item.start_time}|${item.end_time}`;
    const list = slots.get(key) ?? [];
    list.push(item);
    slots.set(key, list);
  }

  return [...slots.entries()]
    .map(([key, slotItems]) => {
      const [start, end] = key.split("|");
      const byDay = WEEKDAYS.map((day) =>
        slotItems
          .filter((item) => item.day_of_week === day)
          .sort((a, b) => a.title.localeCompare(b.title)),
      );

      let mergedThrough = 0;
      if (byDay[0].length === 1) {
        const sig = contentSignature(byDay[0][0]);
        while (
          mergedThrough < byDay.length &&
          byDay[mergedThrough].length === 1 &&
          contentSignature(byDay[mergedThrough][0]) === sig
        ) {
          mergedThrough++;
        }
      }
      if (mergedThrough < 2) mergedThrough = 0;

      return {
        key,
        start,
        end,
        mergedThrough,
        mergedItem: mergedThrough > 0 ? byDay[0][0] : null,
        byDay,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

export function ScheduleTable({ items }: { items: ScheduleItem[] }) {
  const rows = buildRows(items);

  if (rows.length === 0) {
    return (
      <div className={cardClassName}>
        <p className="text-sm text-stone-500">등록된 시간표 항목이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto ${cardClassName}`}>
      <table className="w-full min-w-[760px] border-separate border-spacing-1 text-sm">
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
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="whitespace-nowrap rounded-lg bg-stone-50 px-2 py-3 align-top text-xs font-medium text-stone-600">
                {formatTime(row.start)}~{formatTime(row.end)}
              </td>

              {row.mergedThrough > 0 && row.mergedItem && (
                <td
                  colSpan={row.mergedThrough}
                  className="rounded-lg border border-stone-200 bg-stone-50/60 px-2 py-3 text-center text-stone-700"
                >
                  {row.mergedItem.title}
                  {row.mergedItem.subtitle && (
                    <span className="block text-xs text-stone-500">
                      {row.mergedItem.subtitle}
                    </span>
                  )}
                </td>
              )}

              {row.byDay.slice(row.mergedThrough).map((dayItems, index) => (
                <td
                  key={WEEKDAY_LABELS[row.mergedThrough + index]}
                  className="rounded-lg border border-stone-100 p-1 align-top"
                >
                  {dayItems.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-md border px-2 py-1.5 text-center text-xs font-medium ${CLASS_COLOR_CARD_CLASS[item.color]}`}
                        >
                          {item.title}
                          {item.subtitle && (
                            <span className="block text-[11px] opacity-80">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
