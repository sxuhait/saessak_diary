"use client";

import { useState } from "react";
import {
  CLASS_COLORS,
  CLASS_COLOR_DOT_CLASS,
  CLASS_COLOR_LABELS,
  type ClassColor,
} from "@/lib/class-colors";

export function ColorPicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: ClassColor;
}) {
  const [value, setValue] = useState<ClassColor>(defaultValue);

  return (
    <div className="flex flex-wrap gap-2">
      <input type="hidden" name={name} value={value} />
      {CLASS_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => setValue(color)}
          aria-label={CLASS_COLOR_LABELS[color]}
          aria-pressed={value === color}
          className={`h-6 w-6 rounded-full ${CLASS_COLOR_DOT_CLASS[color]} ${
            value === color
              ? "ring-2 ring-stone-900 ring-offset-2"
              : "ring-1 ring-stone-200 ring-offset-1"
          }`}
        />
      ))}
    </div>
  );
}
