// day_of_week convention shared with weekday_registrations: 0 = Sunday .. 6 = Saturday.
export const DAY_LABELS = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
] as const;

export function formatDayOfWeek(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? "-";
}
