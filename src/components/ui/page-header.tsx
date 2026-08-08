import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  backHref,
  backLabel,
  title,
  description,
  action,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-emerald-700"
      >
        ← {backLabel}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-stone-500">{description}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
