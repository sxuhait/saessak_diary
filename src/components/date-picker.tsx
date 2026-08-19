"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { fieldClass } from "@/components/ui/form";

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const displayFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// Two usage modes, picked by which props are passed:
//   - form field (name + optional defaultValue): uncontrolled, always has a
//     concrete date (defaults to today), submits via a hidden input. Used
//     wherever a date is a required part of a record (session log date,
//     event start/end, ...).
//   - filter (value + onChange, name omitted): controlled, "" is a valid
//     value meaning "전체" (no date selected/no filter applied) -- shows a
//     placeholder and an "전체 날짜" clear option in the popover footer
//     instead of always resolving to some concrete date. Used by list-page
//     date filters (e.g. "내 일지") so the filter's button matches the
//     width/height of neighboring text/select fields exactly (a native
//     <input type="date"> renders with browser-controlled sizing that
//     fieldClass can't fully override -- see fieldClass's comment).
export function DatePicker({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder = "날짜 선택",
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? toISODate(new Date()));
  const value = isControlled ? controlledValue : internalValue;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function selectDate(date: Date) {
    const iso = toISODate(date);
    if (!isControlled) setInternalValue(iso);
    onChange?.(iso);
    setOpen(false);
  }

  const selectedDate = value ? fromISODate(value) : undefined;

  return (
    <div ref={containerRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`${fieldClass} text-left ${!selectedDate ? "text-stone-400" : ""}`}
      >
        {selectedDate ? displayFormatter.format(selectedDate) : placeholder}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            locale={ko}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              selectDate(date);
            }}
          />
          {isControlled && value && (
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
              className="mt-1 w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              전체 날짜
            </button>
          )}
        </div>
      )}
    </div>
  );
}
