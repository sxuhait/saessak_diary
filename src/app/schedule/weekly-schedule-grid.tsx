"use client";

import { Fragment, useMemo, useState } from "react";
import { cardClassName } from "@/components/ui/card";

export type ScheduleBlock = {
  id: string;
  dayOfWeek: number; // 0 = Sun .. 6 = Sat, matches classes/mentor_schedules convention
  startTime: string; // "HH:MM" or "HH:MM:SS"
  endTime: string | null;
  category: "mentoring" | "field_trip" | "camp" | "other";
  title: string;
  subtitle: string | null;
  mentorId: string | null;
};

const OPEN_HOUR = 9;
const CLOSE_HOUR = 20;
const LUNCH_HOUR = 12;
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon..Fri
const WEEKDAY_LABELS = ["월", "화", "수", "목", "금"];

const CATEGORY_STYLES: Record<
  ScheduleBlock["category"],
  { bg: string; border: string; text: string; label: string; dot: string }
> = {
  mentoring: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-800",
    label: "1:1 멘토링",
    dot: "bg-violet-500",
  },
  field_trip: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-800",
    label: "견학",
    dot: "bg-sky-500",
  },
  camp: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    label: "캠프",
    dot: "bg-emerald-500",
  },
  other: {
    bg: "bg-stone-100",
    border: "border-stone-300",
    text: "text-stone-700",
    label: "기타 행사",
    dot: "bg-stone-400",
  },
};

function parseHour(time: string) {
  return parseInt(time.split(":")[0] ?? "0", 10);
}

function parseMinute(time: string) {
  return parseInt(time.split(":")[1] ?? "0", 10);
}

type PlacedGroup = {
  key: string;
  dayIndex: number;
  rowStart: number;
  rowSpan: number;
  items: ScheduleBlock[];
};

function computeGroups(blocks: ScheduleBlock[]): PlacedGroup[] {
  const buckets = new Map<string, PlacedGroup>();

  for (const block of blocks) {
    const dayIndex = WEEKDAYS.indexOf(block.dayOfWeek);
    if (dayIndex === -1) continue;

    let startHour = Math.max(parseHour(block.startTime), OPEN_HOUR);
    if (startHour === LUNCH_HOUR) startHour += 1;
    if (startHour >= CLOSE_HOUR) continue;

    let endHour = block.endTime ? parseHour(block.endTime) : startHour + 1;
    if (block.endTime && parseMinute(block.endTime) > 0) endHour += 1;
    endHour = Math.min(Math.max(endHour, startHour + 1), CLOSE_HOUR);
    // Blocks that would cross the lunch hour are clamped to stop there --
    // this app doesn't model split/interrupted sessions, so cutting at the
    // boundary is simpler and safer than overlapping the lunch banner.
    if (startHour < LUNCH_HOUR && endHour > LUNCH_HOUR) endHour = LUNCH_HOUR;

    const rowStart = startHour - OPEN_HOUR;
    const rowSpan = Math.max(1, endHour - startHour);
    const key = `${dayIndex}-${rowStart}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.rowSpan = Math.max(existing.rowSpan, rowSpan);
      existing.items.push(block);
    } else {
      buckets.set(key, { key, dayIndex, rowStart, rowSpan, items: [block] });
    }
  }

  return [...buckets.values()];
}

export function WeeklyScheduleGrid({
  blocks,
  currentUserId,
}: {
  blocks: ScheduleBlock[];
  currentUserId?: string;
}) {
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");

  const visibleBlocks = useMemo(
    () =>
      viewMode === "all"
        ? blocks
        : blocks.filter((block) => block.mentorId === currentUserId),
    [blocks, viewMode, currentUserId],
  );

  const groups = useMemo(() => computeGroups(visibleBlocks), [visibleBlocks]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "all"
                ? "bg-emerald-600 text-white"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            전체 일정
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mine")}
            disabled={!currentUserId}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              viewMode === "mine"
                ? "bg-emerald-600 text-white"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            내 일정
          </button>
        </div>
      </div>

      <div className={`w-full overflow-x-auto ${cardClassName}`}>
        <div
          className="grid min-w-[720px]"
          style={{ gridTemplateColumns: "88px repeat(5, minmax(0, 1fr))" }}
        >
          <div
            style={{ gridColumn: 1, gridRow: 1 }}
            className="rounded-tl-xl bg-emerald-50"
          />
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              style={{ gridColumn: index + 2, gridRow: 1 }}
              className="bg-emerald-50 px-2 py-2.5 text-center text-sm font-semibold text-emerald-700"
            >
              {label}
            </div>
          ))}

          {HOURS.map((hour, rowIndex) => (
            <Fragment key={hour}>
              <div
                style={{ gridColumn: 1, gridRow: rowIndex + 2 }}
                className="border-t border-stone-100 bg-stone-50 px-2 py-1 text-right text-xs font-medium whitespace-nowrap text-stone-500"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
              {hour === LUNCH_HOUR ? (
                <div
                  style={{ gridColumn: "2 / -1", gridRow: rowIndex + 2 }}
                  className="flex items-center justify-center border-t border-stone-100 bg-stone-100 text-xs font-medium tracking-wide text-stone-400"
                >
                  점심시간
                </div>
              ) : (
                WEEKDAYS.map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    style={{ gridColumn: dayIndex + 2, gridRow: rowIndex + 2 }}
                    className="border-t border-l border-stone-100"
                  />
                ))
              )}
            </Fragment>
          ))}

          {groups.map((group) => (
            <div
              key={group.key}
              style={{
                gridColumn: group.dayIndex + 2,
                gridRow: `${group.rowStart + 2} / span ${group.rowSpan}`,
              }}
              className="flex flex-col gap-1 p-1"
            >
              {group.items.map((item) => {
                const style = CATEGORY_STYLES[item.category];
                return (
                  <div
                    key={item.id}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${style.bg} ${style.border} ${style.text}`}
                  >
                    <p className="font-semibold">{item.title}</p>
                    {item.subtitle && (
                      <p className="mt-0.5 truncate opacity-80">{item.subtitle}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
        {Object.values(CATEGORY_STYLES).map((style) => (
          <span key={style.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden />
            {style.label}
          </span>
        ))}
      </div>

      {viewMode === "mine" && !currentUserId && (
        <p className="text-xs text-stone-400">로그인 정보를 확인할 수 없어 내 일정을 표시할 수 없습니다.</p>
      )}
    </div>
  );
}
