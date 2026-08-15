"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchGlobal, type SearchResults } from "./search-actions";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatSessionDate(sessionDate: string) {
  const [year, month, day] = sessionDate.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestQueryRef = useRef("");

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

  useEffect(() => {
    const trimmed = query.trim();
    latestQueryRef.current = trimmed;

    if (!trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      searchGlobal(trimmed).then((data) => {
        // Ignore stale responses from a query that's since been superseded.
        if (latestQueryRef.current === trimmed) {
          setResults(data);
          setLoading(false);
        }
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (value.trim()) {
      setLoading(true);
    } else {
      setLoading(false);
      setResults(null);
    }
  }

  function handleSelect() {
    setOpen(false);
    setQuery("");
    setResults(null);
  }

  const trimmedQuery = query.trim();
  const showPanel = open && trimmedQuery.length > 0;
  const menteeResults = results?.mentees ?? [];
  const logResults = results?.logs ?? [];
  const hasResults = menteeResults.length > 0 || logResults.length > 0;

  return (
    <div className="relative w-full max-w-sm" ref={containerRef}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => {
          if (trimmedQuery) setOpen(true);
        }}
        placeholder="일지, 멘티 검색..."
        aria-label="일지, 멘티 검색"
        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pr-4 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      />

      {showPanel && (
        <div className="absolute top-11 left-0 z-50 w-full max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
          {loading && !results ? (
            <p className="px-2 py-6 text-center text-sm text-stone-500">검색 중...</p>
          ) : !hasResults ? (
            <p className="px-2 py-6 text-center text-sm text-stone-500">
              검색 결과가 없습니다
            </p>
          ) : (
            <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {menteeResults.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-stone-400">멘티</p>
                  <ul className="flex flex-col gap-0.5">
                    {menteeResults.map((mentee) => (
                      <li key={mentee.id}>
                        <Link
                          href={`/mentees/${mentee.id}`}
                          onClick={handleSelect}
                          className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-emerald-50"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                            {mentee.name[0]}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-stone-900">
                              {mentee.name}
                            </span>
                            {mentee.subtitle && (
                              <span className="truncate text-xs text-stone-500">
                                {mentee.subtitle}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {logResults.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-xs font-semibold text-stone-400">일지</p>
                  <ul className="flex flex-col gap-0.5">
                    {logResults.map((log) => (
                      <li key={log.id}>
                        <Link
                          href={`/mentees/${log.menteeId}`}
                          onClick={handleSelect}
                          className="flex flex-col gap-0.5 rounded-xl px-2 py-2 hover:bg-emerald-50"
                        >
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-stone-900">
                              {formatSessionDate(log.sessionDate)}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              {log.menteeName}
                            </span>
                            {log.subject && (
                              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">
                                {log.subject}
                              </span>
                            )}
                          </span>
                          <span className="truncate text-xs text-stone-500">
                            {log.preview}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
