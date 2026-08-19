// Rule-based learning diagnostics for a single mentee -- no AI/external API,
// just date-diff / count / ratio checks over that mentee's session_logs and
// attendance rows. Kept as a pure function (no Supabase, no React) so an AI
// natural-language layer can later read `DiagnosticFinding[]` and phrase it,
// without touching this rule logic.

export type SessionLogInput = {
  session_date: string; // YYYY-MM-DD
  subject: string | null;
};

// A single session log can now carry multiple subject/progress lines (see
// session_log_subjects). The rules below only care about (date, subject)
// pairs, so rather than teaching every rule about the one-to-many shape,
// callers flatten each log into one SessionLogInput per subject line here
// (or one subject: null entry for a log with no subject lines at all, so
// "no logs yet" still reads as zero entries only when there really are no
// session_logs rows).
export function flattenSubjectLogs(
  logs: { session_date: string; subjects: { subject: string }[] }[],
): SessionLogInput[] {
  const result: SessionLogInput[] = [];
  for (const log of logs) {
    if (log.subjects.length === 0) {
      result.push({ session_date: log.session_date, subject: null });
      continue;
    }
    for (const { subject } of log.subjects) {
      result.push({ session_date: log.session_date, subject });
    }
  }
  return result;
}

export type AttendanceInput = {
  session_date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "excused";
};

export type DiagnosticSeverity = "critical" | "warning" | "info";

export type DiagnosticFinding = {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  description: string;
};

const STALE_SUBJECT_WARN_DAYS = 14;
const STALE_SUBJECT_CRITICAL_DAYS = 28;

const INACTIVITY_WINDOW_DAYS = 14;
const INACTIVITY_CRITICAL_DAYS = 28;

const ATTENDANCE_RECENT_WINDOW = 8;
const ATTENDANCE_MIN_RECORDS = 4;
const ATTENDANCE_WARN_RATIO = 0.5;
const ATTENDANCE_CRITICAL_RATIO = 0.75;

const WEEKDAY_MIN_OCCURRENCES = 3;
const WEEKDAY_WARN_RATIO = 2 / 3;

const SUBJECT_BALANCE_MIN_LOGS = 5;
const SUBJECT_BALANCE_WARN_RATIO = 0.7;
const SUBJECT_BALANCE_CRITICAL_RATIO = 0.85;

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - fromMidnight.getTime()) / msPerDay);
}

function findStaleSubjects(
  logs: SessionLogInput[],
  today: Date,
): DiagnosticFinding[] {
  const lastBySubject = new Map<string, Date>();
  for (const log of logs) {
    if (!log.subject) continue;
    const date = parseLocalDate(log.session_date);
    const prev = lastBySubject.get(log.subject);
    if (!prev || date.getTime() > prev.getTime()) {
      lastBySubject.set(log.subject, date);
    }
  }

  const withDaysAgo = [...lastBySubject.entries()]
    .map(([subject, lastDate]) => ({
      subject,
      daysAgo: daysBetween(lastDate, today),
    }))
    .filter((entry) => entry.daysAgo >= STALE_SUBJECT_WARN_DAYS)
    .sort((a, b) => b.daysAgo - a.daysAgo);

  return withDaysAgo.map(({ subject, daysAgo }) => ({
    id: `stale-subject-${subject}`,
    severity: daysAgo >= STALE_SUBJECT_CRITICAL_DAYS ? "critical" : "warning",
    title: `${subject} ${Math.floor(daysAgo / 7)}주째 안 함`,
    description: `마지막 학습일로부터 ${daysAgo}일이 지났습니다.`,
  }));
}

function findInactivity(logs: SessionLogInput[], today: Date): DiagnosticFinding[] {
  if (logs.length === 0) {
    return [
      {
        id: "no-logs",
        severity: "warning",
        title: "작성된 일지가 아직 없습니다",
        description: "첫 학습 일지를 작성해 주세요.",
      },
    ];
  }

  const mostRecent = logs.reduce((latest, log) => {
    const date = parseLocalDate(log.session_date);
    return date.getTime() > latest.getTime() ? date : latest;
  }, parseLocalDate(logs[0].session_date));

  const daysSinceLast = daysBetween(mostRecent, today);
  if (daysSinceLast < INACTIVITY_WINDOW_DAYS) return [];

  return [
    {
      id: "inactivity",
      severity: daysSinceLast >= INACTIVITY_CRITICAL_DAYS ? "critical" : "warning",
      title: `최근 ${INACTIVITY_WINDOW_DAYS}일간 학습 일지가 없습니다`,
      description: `마지막 일지 작성일로부터 ${daysSinceLast}일이 지났습니다.`,
    },
  ];
}

function findAttendanceIssues(attendance: AttendanceInput[]): DiagnosticFinding[] {
  const recent = [...attendance]
    .sort(
      (a, b) =>
        parseLocalDate(b.session_date).getTime() -
        parseLocalDate(a.session_date).getTime(),
    )
    .slice(0, ATTENDANCE_RECENT_WINDOW);

  const findings: DiagnosticFinding[] = [];

  if (recent.length >= ATTENDANCE_MIN_RECORDS) {
    const bad = recent.filter(
      (record) => record.status === "absent" || record.status === "late",
    );
    const ratio = bad.length / recent.length;
    if (ratio >= ATTENDANCE_WARN_RATIO) {
      findings.push({
        id: "attendance-overall",
        severity: ratio >= ATTENDANCE_CRITICAL_RATIO ? "critical" : "warning",
        title: `최근 출석 ${recent.length}회 중 결석/지각 ${bad.length}회`,
        description: "출석이 불안정합니다. 보호자 확인이 필요할 수 있습니다.",
      });
    }
  }

  const byWeekday = new Map<number, { total: number; absent: number }>();
  for (const record of recent) {
    const weekday = parseLocalDate(record.session_date).getDay();
    const entry = byWeekday.get(weekday) ?? { total: 0, absent: 0 };
    entry.total += 1;
    if (record.status === "absent") entry.absent += 1;
    byWeekday.set(weekday, entry);
  }

  for (const [weekday, { total, absent }] of byWeekday) {
    if (total < WEEKDAY_MIN_OCCURRENCES) continue;
    const ratio = absent / total;
    if (ratio < WEEKDAY_WARN_RATIO) continue;
    findings.push({
      id: `attendance-weekday-${weekday}`,
      severity: absent === total ? "critical" : "warning",
      title: `최근 ${DAY_LABELS[weekday]}요일 ${total}회 중 ${absent}회 결석`,
      description: "특정 요일에 결석이 몰려 있습니다.",
    });
  }

  return findings;
}

function findSubjectImbalance(logs: SessionLogInput[]): DiagnosticFinding[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const log of logs) {
    if (!log.subject) continue;
    counts.set(log.subject, (counts.get(log.subject) ?? 0) + 1);
    total += 1;
  }

  if (total < SUBJECT_BALANCE_MIN_LOGS || counts.size < 2) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [topSubject, topCount] = sorted[0];
  const ratio = topCount / total;
  if (ratio < SUBJECT_BALANCE_WARN_RATIO) return [];

  const others = sorted
    .slice(1)
    .map(([subject]) => subject)
    .join(", ");

  return [
    {
      id: "subject-imbalance",
      severity: ratio >= SUBJECT_BALANCE_CRITICAL_RATIO ? "critical" : "warning",
      title: `${topSubject} 과목에 편중 (전체 일지의 ${Math.round(ratio * 100)}%)`,
      description: `${others} 과목의 학습 비중이 상대적으로 낮습니다.`,
    },
  ];
}

export function diagnoseLearning({
  logs,
  attendance,
  today = new Date(),
}: {
  logs: SessionLogInput[];
  attendance: AttendanceInput[];
  today?: Date;
}): DiagnosticFinding[] {
  const findings = [
    ...findInactivity(logs, today),
    ...findStaleSubjects(logs, today),
    ...findAttendanceIssues(attendance),
    ...findSubjectImbalance(logs),
  ];

  if (findings.length === 0) {
    return [
      {
        id: "all-clear",
        severity: "info",
        title: "특이사항 없음",
        description:
          "최근 학습·출석 기록에서 특별한 경고 사항이 발견되지 않았습니다.",
      },
    ];
  }

  const severityRank: Record<DiagnosticSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
