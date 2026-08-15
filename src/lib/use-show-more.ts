"use client";

import { useState } from "react";

// Shared "show N, load more" pagination for long client-rendered lists
// (profile's mentee list, the /mentees grid). Purely a slice over whatever
// array the caller passes in, so it composes with search/filtering for free
// -- filter first, then pass the filtered array in here.
export function useShowMore<T>(items: T[], pageSize: number) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  function showMore() {
    setVisibleCount((count) => count + pageSize);
  }

  function reset() {
    setVisibleCount(pageSize);
  }

  return { visibleItems, hasMore, remaining, showMore, reset };
}
