// Shared className constants for form controls and buttons, kept as plain
// strings (rather than wrapper components) so existing <input>/<select}/
// <textarea>/<button> elements can adopt the shared look with a one-line
// className swap, without changing how each form handles refs/state/actions.

export const labelClass = "mb-1.5 block text-sm font-medium text-stone-700";

// min-w-0 overrides the browser default (min-width: auto) that some native
// controls -- <input type="date">/"time" especially -- otherwise use, which
// lets them ignore w-full and overflow a narrow flex/grid cell on mobile.
export const fieldClass =
  "w-full min-w-0 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export const primaryButtonClass =
  "rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50";

// Small pill variant for actions inside list rows/badges (e.g. "출석 체크"
// link in a page header) where the full-size button would be too heavy.
export const primaryPillClass =
  "rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700";

export const secondaryPillClass =
  "rounded-full border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50";

// Plain-text action links used inside list rows (mentee/class list "수정" /
// "삭제"), matching the target design's borderless text buttons.
export const textActionClass =
  "text-sm font-medium text-stone-600 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50";

export const textDangerActionClass =
  "text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50";
