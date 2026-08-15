// Shared, request-deduped fetch of "all mentees + all session_logs +
// all attendance" -- the raw material for diagnoseLearning() findings.
// layout.tsx (notification bell), the home dashboard, and the mypage alert
// card each need this same center-wide data; wrapping it in React's cache()
// means only the first caller in a given request actually hits Supabase --
// the rest reuse that result instead of re-querying and re-building the maps.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceInput, SessionLogInput } from "@/lib/learning-diagnostics";

export type MenteeDiagnosticsData = {
  mentees: { id: string; name: string }[];
  logsByMentee: Map<string, SessionLogInput[]>;
  attendanceByMentee: Map<string, AttendanceInput[]>;
};

export const getMenteeDiagnosticsData = cache(
  async (): Promise<MenteeDiagnosticsData> => {
    const supabase = await createClient();

    const { data: mentees } = await supabase
      .from("mentees")
      .select("id, name")
      .order("name");
    const menteeIds = (mentees ?? []).map((mentee) => mentee.id);

    const [{ data: logRows }, { data: attendanceRows }] = menteeIds.length
      ? await Promise.all([
          supabase
            .from("session_logs")
            .select("mentee_id, session_date, subject")
            .in("mentee_id", menteeIds),
          supabase
            .from("attendance")
            .select("mentee_id, session_date, status")
            .in("mentee_id", menteeIds),
        ])
      : [{ data: [] }, { data: [] }];

    const logsByMentee = new Map<string, SessionLogInput[]>();
    for (const log of logRows ?? []) {
      const list = logsByMentee.get(log.mentee_id) ?? [];
      list.push({ session_date: log.session_date, subject: log.subject });
      logsByMentee.set(log.mentee_id, list);
    }

    const attendanceByMentee = new Map<string, AttendanceInput[]>();
    for (const record of attendanceRows ?? []) {
      const list = attendanceByMentee.get(record.mentee_id) ?? [];
      list.push({ session_date: record.session_date, status: record.status });
      attendanceByMentee.set(record.mentee_id, list);
    }

    return { mentees: mentees ?? [], logsByMentee, attendanceByMentee };
  },
);
