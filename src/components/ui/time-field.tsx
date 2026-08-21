"use client";

import { useState } from "react";
import { fieldClass, textActionClass } from "@/components/ui/form";
import { TIME_OPTIONS, formatTypedTime, isValidTimeValue } from "@/lib/time-format";

const MANUAL_OPTION = "__manual__";

// Defaults to a single 30-minute-increment <select> ("시간 선택" placeholder
// plus a trailing "직접 입력" option) so picking a time is one control, not
// two competing side by side. Choosing "직접 입력" swaps in the free-text
// "1400" -> "14:00" input, with a link back to the list. First built for
// event schedules (events/schedule-editor.tsx), reused wherever a mentor
// needs to enter a clock time (today/mentor-schedule-manager.tsx) so the two
// features behave identically.
export function TimeField({
  id,
  name,
  value,
  onChange,
  required,
  ariaLabel,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  ariaLabel: string;
}) {
  const isListedValue = value === "" || (TIME_OPTIONS as readonly string[]).includes(value);
  // Starts in manual mode if the incoming value is a custom time not on the
  // 30-minute grid (e.g. editing an existing "14:15" entry), so it isn't
  // silently hidden behind the list. Local state, not re-derived on every
  // value change, since the user's mode choice while typing shouldn't be
  // overridden by their own keystrokes.
  const [manual, setManual] = useState(() => !isListedValue);

  if (manual) {
    const invalid = value !== "" && !isValidTimeValue(value);

    return (
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          maxLength={5}
          required={required}
          value={value}
          onChange={(e) => onChange(formatTypedTime(e.target.value))}
          placeholder="예: 1400"
          aria-label={ariaLabel}
          pattern="([01]\d|2[0-3]):[0-5]\d"
          title="24시간 형식으로 입력해주세요 (예: 14:00)"
          className={`${fieldClass} min-w-0 bg-white ${
            invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => {
            setManual(false);
            onChange((TIME_OPTIONS as readonly string[]).includes(value) ? value : "");
          }}
          className={`shrink-0 whitespace-nowrap ${textActionClass}`}
        >
          목록에서 선택
        </button>
      </div>
    );
  }

  return (
    <select
      id={id}
      name={name}
      required={required}
      value={value}
      onChange={(e) => {
        if (e.target.value === MANUAL_OPTION) {
          setManual(true);
          onChange("");
          return;
        }
        onChange(e.target.value);
      }}
      aria-label={ariaLabel}
      className={`${fieldClass} min-w-0 bg-white`}
    >
      <option value="">시간 선택</option>
      {TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
      <option value={MANUAL_OPTION}>직접 입력</option>
    </select>
  );
}
