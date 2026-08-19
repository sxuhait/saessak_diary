"use server";

import { createClient } from "@/lib/supabase/server";

export type MenteeSearchResult = {
  type: "mentee";
  id: string;
  name: string;
  subtitle: string | null;
};

export type LogSearchResult = {
  type: "log";
  id: string;
  menteeId: string;
  menteeName: string;
  sessionDate: string;
  subjects: string[];
  preview: string;
};

export type SearchResults = {
  mentees: MenteeSearchResult[];
  logs: LogSearchResult[];
};

const EMPTY_RESULTS: SearchResults = { mentees: [], logs: [] };

// PostgREST's .or() takes a raw "cond1,cond2" string, so commas/parens in the
// search term would break the filter syntax. % and _ are ILIKE wildcards, so
// escape those too so a literal search term doesn't act as a wildcard.
function sanitizeSearchTerm(term: string) {
  return term.replace(/[,()]/g, " ").replace(/[%_]/g, "\\$&").trim();
}

export async function searchGlobal(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim();
  if (!query) return EMPTY_RESULTS;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return EMPTY_RESULTS;

  const term = sanitizeSearchTerm(query);
  if (!term) return EMPTY_RESULTS;

  const logColumns =
    "id, session_date, content, mentee_id, mentees(name), session_log_subjects(subject)";

  // subject now lives in a child table (session_log_subjects), so a single
  // .or() across both columns like the pre-multi-subject version used isn't
  // possible -- find matches by content and by subject separately, then
  // merge, since a log can match on either.
  const [menteesResult, contentMatches, subjectMatchRows] = await Promise.all([
    supabase
      .from("mentees")
      .select("id, name, school, grade")
      .ilike("name", `%${term}%`)
      .order("name")
      .limit(5),
    supabase
      .from("session_logs")
      .select(logColumns)
      .ilike("content", `%${term}%`)
      .order("session_date", { ascending: false })
      .limit(5),
    supabase
      .from("session_log_subjects")
      .select("session_log_id")
      .ilike("subject", `%${term}%`)
      .limit(10),
  ]);

  const mentees: MenteeSearchResult[] = (menteesResult.data ?? []).map((mentee) => ({
    type: "mentee",
    id: mentee.id,
    name: mentee.name,
    subtitle: [mentee.school, mentee.grade].filter(Boolean).join(" · ") || null,
  }));

  const contentMatchRows = contentMatches.data ?? [];
  const alreadyMatchedIds = new Set(contentMatchRows.map((log) => log.id));
  const subjectOnlyIds = [
    ...new Set((subjectMatchRows.data ?? []).map((row) => row.session_log_id)),
  ].filter((id) => !alreadyMatchedIds.has(id));

  const subjectOnlyMatches = subjectOnlyIds.length
    ? await supabase.from("session_logs").select(logColumns).in("id", subjectOnlyIds)
    : { data: [] };

  const logRows = [...contentMatchRows, ...(subjectOnlyMatches.data ?? [])]
    .sort((a, b) => (a.session_date < b.session_date ? 1 : a.session_date > b.session_date ? -1 : 0))
    .slice(0, 5);

  const logs: LogSearchResult[] = logRows.map((log) => ({
    type: "log",
    id: log.id,
    menteeId: log.mentee_id,
    menteeName: log.mentees?.name ?? "알 수 없음",
    sessionDate: log.session_date,
    subjects: log.session_log_subjects.map((s) => s.subject),
    preview: log.content ?? "",
  }));

  return { mentees, logs };
}
