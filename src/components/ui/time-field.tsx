"use client";

import { fieldClass } from "@/components/ui/form";
import { TIME_OPTIONS, formatTypedTime, isValidTimeValue } from "@/lib/time-format";

// 24-hour typed input ("1400" -> "14:00" as you type) plus a 30-minute
// picker dropdown, kept in sync through the same value/onChange. First built
// for event schedules (events/schedule-editor.tsx), reused wherever a
// mentor needs to enter a clock time (today/mentor-schedule-manager.tsx) so
// the two features behave identically.
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
  const invalid = value !== "" && !isValidTimeValue(value);

  return (
    // Stacked below sm: (each control gets its own full-width row) so the
    // fixed-width text input and the dropdown never have to compete for
    // horizontal space on a narrow phone -- side by side only from sm: up,
    // where there's reliably enough width for both.
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
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
        className={`${fieldClass} min-w-0 bg-white sm:w-24 sm:shrink-0 ${
          invalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
        }`}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${ariaLabel} 목록에서 선택`}
        className={`${fieldClass} min-w-0 bg-white sm:flex-1`}
      >
        <option value="">직접 입력</option>
        {TIME_OPTIONS.map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
    </div>
  );
}
