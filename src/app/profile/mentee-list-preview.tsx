"use client";

import Link from "next/link";
import { useShowMore } from "@/lib/use-show-more";
import { secondaryButtonClass } from "@/components/ui/form";

const PAGE_SIZE = 10;

type Mentee = { id: string; name: string };

export function MenteeListPreview({ mentees }: { mentees: Mentee[] }) {
  const { visibleItems, hasMore, remaining, showMore } = useShowMore(
    mentees,
    PAGE_SIZE,
  );

  return (
    <>
      <ul className="mt-3 flex flex-col divide-y divide-stone-100">
        {visibleItems.map((mentee) => (
          <li key={mentee.id}>
            <Link
              href={`/mentees/${mentee.id}`}
              className="block py-2 text-sm font-medium text-stone-900 hover:text-emerald-700"
            >
              {mentee.name}
            </Link>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={showMore}
          className={`mt-3 w-full ${secondaryButtonClass}`}
        >
          더보기 ({remaining}명 더)
        </button>
      )}
    </>
  );
}
