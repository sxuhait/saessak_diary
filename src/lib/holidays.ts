// Manually maintained Korean public holiday (관공서의 공휴일에 관한 규정)
// list, covering 2025-2027. Update this once a year (e.g. each December,
// once the government publishes next year's calendar).
//
// Why hardcoded instead of a library or the data.go.kr 특일정보 API: this is
// a single-center internal tool, and lunar-calendar holidays (설날, 추석,
// 부처님오신날) plus 대체공휴일 (substitute-holiday) rules aren't computable
// without a lunar calendar table anyway -- any library or API ends up
// maintaining the same kind of table under the hood. Keeping a short,
// explicit list here avoids an API key, a network call on every calendar
// render, and a new failure mode (API down = calendar breaks), at the cost
// of needing a manual addition once these years run out.
//
// Note: 근로자의 날(Labor Day, May 1) and 제헌절(Constitution Day, July 17)
// are intentionally excluded -- neither is a 관공서 공휴일 (the center/kids'
// schools are not closed on those days).
export const KOREAN_HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-01-01": "신정",
  "2025-01-27": "임시공휴일",
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-03-01": "삼일절",
  "2025-05-05": "어린이날",
  "2025-05-06": "대체공휴일",
  "2025-06-03": "대통령 선거일",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-08": "대체공휴일",
  "2025-10-09": "한글날",
  "2025-12-25": "크리스마스",

  // 2026
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-03": "지방선거일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "크리스마스",

  // 2027
  "2027-01-01": "신정",
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  "2027-02-09": "대체공휴일",
  "2027-03-01": "삼일절",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-08-15": "광복절",
  "2027-08-16": "대체공휴일",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절",
  "2027-10-04": "대체공휴일",
  "2027-10-09": "한글날",
  "2027-10-11": "대체공휴일",
  "2027-12-25": "크리스마스",
  "2027-12-27": "대체공휴일",
};

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getHolidayName(date: Date): string | undefined {
  return KOREAN_HOLIDAYS[toISODate(date)];
}

export function isCenterClosed(date: Date): boolean {
  return isWeekend(date) || getHolidayName(date) !== undefined;
}
