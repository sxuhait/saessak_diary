import type { ReactNode } from "react";

// Exported as a raw string too, for elements that can't be a nested <div>
// (e.g. a <form> that needs the card look on the element carrying the
// `action` prop itself).
export const cardClassName =
  "rounded-3xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${cardClassName} ${className}`}>{children}</div>;
}
