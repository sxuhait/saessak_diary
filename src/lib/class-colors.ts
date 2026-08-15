import type { Enums } from "@/lib/database.types";

export type ClassColor = Enums<"class_color">;

// The 8 enum keys are fixed in the DB (class_color type) -- renaming them
// would need a migration. So this is where the enum keys get their actual
// look: each key below is now a soft pastel rather than the old bold/500
// hue, remapped to the closest-feeling pastel (rose->soft pink,
// teal->mint, etc.) so existing classes carry over to a similar-looking
// color with no data migration needed. Still avoids the app's core
// emerald (brand/"present" status) and red (error) so class colors don't
// get confused with those meanings.
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
  rose: "연한 분홍",
  orange: "살구",
  violet: "라벤더",
  sky: "하늘",
  fuchsia: "연보라",
  indigo: "복숭아",
  teal: "민트",
  cyan: "연노랑",
};

// -300 shades: pastel enough to read as soft, still saturated enough that
// small calendar dots stay visible/distinguishable on a white background.
export const CLASS_COLOR_DOT_CLASS: Record<ClassColor, string> = {
  rose: "bg-rose-300",
  orange: "bg-amber-300",
  violet: "bg-violet-300",
  sky: "bg-sky-300",
  fuchsia: "bg-fuchsia-300",
  indigo: "bg-orange-300",
  teal: "bg-teal-300",
  cyan: "bg-yellow-300",
};

export function suggestNextColor(existingCount: number): ClassColor {
  return CLASS_COLORS[existingCount % CLASS_COLORS.length];
}

// Same pastel families as CLASS_COLOR_DOT_CLASS, extended into a full
// bg/border/text triad for larger content cards (e.g. schedule_items blocks)
// rather than just a small dot.
export const CLASS_COLOR_CARD_CLASS: Record<ClassColor, string> = {
  rose: "bg-rose-50 border-rose-200 text-rose-800",
  orange: "bg-amber-50 border-amber-200 text-amber-800",
  violet: "bg-violet-50 border-violet-200 text-violet-800",
  sky: "bg-sky-50 border-sky-200 text-sky-800",
  fuchsia: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800",
  indigo: "bg-orange-50 border-orange-200 text-orange-800",
  teal: "bg-teal-50 border-teal-200 text-teal-800",
  cyan: "bg-yellow-50 border-yellow-200 text-yellow-800",
};
