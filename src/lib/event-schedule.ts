// center_events.schedule stays a plain `text` column -- structured
// time-of-day entries are just JSON-encoded into that same column, so no
// migration is needed. Old events saved schedule as free-form text before
// this feature existed; parseSchedule() falls back to a best-effort line
// parse for those instead of throwing away the content.

export type ScheduleItem = {
  time: string; // "HH:MM", or "" if unspecified
  content: string;
};

// 24-hour "HH:MM", no AM/PM. Shared between the client (live validation
// styling on the typed-time input) and the server actions (blocking save on
// a malformed time like "25:00" instead of silently storing it).
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeValue(time: string): boolean {
  return time === "" || TIME_PATTERN.test(time);
}

function isScheduleItem(value: unknown): value is ScheduleItem {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.time === "string" && typeof record.content === "string";
}

function isScheduleItemArray(value: unknown): value is ScheduleItem[] {
  return Array.isArray(value) && value.every(isScheduleItem);
}

// Legacy free-text schedules (e.g. "1일차 09:00 출발 ...") predate this
// feature. Split by line and pull a leading "HH:MM" or "[HH:MM]" off each
// line when present, so editing an old event still gives the mentor
// separate rows to work with instead of one big blob.
const LEADING_TIME_PATTERN = /^\[?([0-2]?\d:[0-5]\d)\]?\s*[-:.]?\s*(.*)$/;

function parseLegacyText(raw: string): ScheduleItem[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(LEADING_TIME_PATTERN);
      if (match) {
        return { time: match[1].padStart(5, "0"), content: match[2].trim() };
      }
      return { time: "", content: line };
    });
}

export function parseSchedule(raw: string | null | undefined): ScheduleItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (isScheduleItemArray(parsed)) {
      return parsed;
    }
  } catch {
    // not JSON -- fall through to legacy free-text handling
  }

  return parseLegacyText(raw);
}

// Structured schedules sort by time; entries with no time sort last (in
// their original relative order).
export function sortScheduleItems(items: ScheduleItem[]): ScheduleItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (!a.item.time && !b.item.time) return a.index - b.index;
      if (!a.item.time) return 1;
      if (!b.item.time) return -1;
      if (a.item.time === b.item.time) return a.index - b.index;
      return a.item.time.localeCompare(b.item.time);
    })
    .map(({ item }) => item);
}

// Drops blank rows, sorts by time, and JSON-encodes for storage. Returns
// null when there's nothing left to save (so the column matches the old
// "no schedule" state instead of storing "[]").
export function serializeSchedule(items: ScheduleItem[]): string | null {
  const cleaned = items
    .map((item) => ({ time: item.time.trim(), content: item.content.trim() }))
    .filter((item) => item.content.length > 0);

  if (cleaned.length === 0) return null;

  return JSON.stringify(sortScheduleItems(cleaned));
}

// Strict parse for the hidden JSON field ScheduleEditor always submits --
// unlike parseSchedule(), this does not fall back to legacy free-text
// parsing, since form submissions are always the structured shape (or
// tampered input, which should just be dropped rather than guessed at).
export function parseScheduleFormInput(raw: string): ScheduleItem[] {
  try {
    const parsed = JSON.parse(raw);
    return isScheduleItemArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Distinguishes a structured schedule (render as a time table) from a
// legacy free-text one (render as a plain paragraph, like before).
export function isStructuredSchedule(raw: string | null | undefined): boolean {
  if (!raw) return false;
  try {
    return isScheduleItemArray(JSON.parse(raw));
  } catch {
    return false;
  }
}
