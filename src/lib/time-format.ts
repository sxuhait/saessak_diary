// Shared 24-hour "HH:MM" time helpers for the typed+dropdown TimeField
// input (src/components/ui/time-field.tsx) and any server action that needs
// to validate a time string received as free text instead of a native
// <input type="time"> (which the browser already constrains to valid HH:MM).

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeValue(time: string): boolean {
  return time === "" || TIME_PATTERN.test(time);
}

// 30-minute increments for the picker list ("09:00", "09:30", ...) --
// alongside, not instead of, direct typing.
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

// Digits-only, auto-inserts the colon once the minute portion starts (e.g.
// typing "1400" becomes "14:00" as you go) -- pure function of the digit
// content so backspacing "un-formats" naturally too.
export function formatTypedTime(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
