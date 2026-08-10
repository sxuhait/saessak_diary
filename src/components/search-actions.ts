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
  subject: string | null;
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

  const [menteesResult, logsResult] = await Promise.all([
    supabase
      .from("mentees")
      .select("id, name, school, grade")
      .ilike("name", `%${term}%`)
      .order("name")
      .limit(5),
    supabase
      .from("session_logs")
      .select("id, session_date, subject, content, mentee_id, mentees(name)")
      .or(`content.ilike.%${term}%,subject.ilike.%${term}%`)
      .order("session_date", { ascending: false })
      .limit(5),
  ]);

  const mentees: MenteeSearchResult[] = (menteesResult.data ?? []).map((mentee) => ({
    type: "mentee",
    id: mentee.id,
    name: mentee.name,
    subtitle: [mentee.school, mentee.grade].filter(Boolean).join(" · ") || null,
  }));

  const logs: LogSearchResult[] = (logsResult.data ?? []).map((log) => ({
    type: "log",
    id: log.id,
    menteeId: log.mentee_id,
    menteeName: log.mentees?.name ?? "알 수 없음",
    sessionDate: log.session_date,
    subject: log.subject,
    preview: log.content,
  }));

  return { mentees, logs };
}
