import type { Enums } from "@/lib/database.types";

export type ClassColor = Enums<"class_color">;

// Deliberately avoids green/red/amber/gray -- those are reserved for
// attendance status and event-type meaning elsewhere in the app. This is a
// pure identity palette: each class gets one fixed hue for as long as it
// exists.
export const CLASS_COLORS: ClassColor[] = [
  "rose",
  "orange",
  "violet",
  "sky",
  "fuchsia",
  "indigo",
  "teal",
  "cyan",
];

export const CLASS_COLOR_LABELS: Record<ClassColor, string> = {
  rose: "로즈",
  orange: "오렌지",
  violet: "보라",
  sky: "하늘",
  fuchsia: "자홍",
  indigo: "남색",
  teal: "청록",
  cyan: "시안",
};

export const CLASS_COLOR_DOT_CLASS: Record<ClassColor, string> = {
  rose: "bg-rose-500",
  orange: "bg-orange-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  fuchsia: "bg-fuchsia-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
};

export function suggestNextColor(existingCount: number): ClassColor {
  return CLASS_COLORS[existingCount % CLASS_COLORS.length];
}
