"use client";

import Link from "next/link";
import { useShowMore } from "@/lib/use-show-more";
import { secondaryButtonClass } from "@/components/ui/form";
import type { DiagnosticFinding, DiagnosticSeverity } from "@/lib/learning-diagnostics";

const PAGE_SIZE = 10;

const ALERT_STYLES: Record<DiagnosticSeverity, { card: string; badge: string }> = {
  critical: {
    card: "border-red-200 bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
  warning: {
    card: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
  },
  info: {
    card: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

type Alert = {
  mentee: { id: string; name: string };
  finding: DiagnosticFinding;
};

export function AlertListPreview({ alerts }: { alerts: Alert[] }) {
  const { visibleItems, hasMore, remaining, showMore } = useShowMore(
    alerts,
    PAGE_SIZE,
  );

  return (
    <>
      <div className="mt-3 flex flex-col gap-2">
        {visibleItems.map(({ mentee, finding }) => {
          const style = ALERT_STYLES[finding.severity];
          return (
            <Link
              key={`${mentee.id}-${finding.id}`}
              href={`/mentees/${mentee.id}`}
              className={`block rounded-xl border p-3 hover:opacity-90 ${style.card}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
                >
                  {mentee.name}
                </span>
                <p className="text-sm font-medium text-stone-900">
                  {finding.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={showMore}
          className={`mt-3 w-full ${secondaryButtonClass}`}
        >
          더보기 ({remaining}건 더)
        </button>
      )}
    </>
  );
}
