// Builders for the notification bell -- each function turns already-fetched
// data into AppNotification[] using existing rules (learning diagnostics,
// volunteer expiration) rather than introducing new ones. Kept as pure
// functions (no Supabase calls) so callers stay in charge of fetching, and so
// adding a new notification kind later is just one more `buildXNotifications`
// plus a line in `buildNotifications`.

import {
  diagnoseLearning,
  type AttendanceInput,
  type SessionLogInput,
} from "./learning-diagnostics";

export type NotificationCategory = "diagnostics" | "event" | "volunteer_expiry";

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  href: string;
};

const EVENT_UPCOMING_WINDOW_DAYS = 7;
const VOLUNTEER_EXPIRY_TOTAL_DAYS = 30;
const VOLUNTEER_EXPIRY_WARN_DAYS = 7;

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

// Mirrors profile page's mypage alerts, but also keeps stale-subject findings
// (the "영어 3주째 안 함" case) -- anything diagnoseLearning flagged as an
// actual issue, i.e. not the "all-clear" info finding.
export function buildDiagnosticsNotifications({
  mentees,
  logsByMentee,
  attendanceByMentee,
  today = new Date(),
}: {
  mentees: { id: string; name: string }[];
  logsByMentee: Map<string, SessionLogInput[]>;
  attendanceByMentee: Map<string, AttendanceInput[]>;
  today?: Date;
}): AppNotification[] {
  return mentees.flatMap((mentee) =>
    diagnoseLearning({
      logs: logsByMentee.get(mentee.id) ?? [],
      attendance: attendanceByMentee.get(mentee.id) ?? [],
      today,
    })
      .filter((finding) => finding.severity !== "info")
      .map((finding) => ({
        id: `diagnostics-${mentee.id}-${finding.id}`,
        category: "diagnostics" as const,
        title: `${mentee.name} - ${finding.title}`,
        description: finding.description,
        href: `/mentees/${mentee.id}`,
      })),
  );
}

export type CenterEventInput = {
  id: string;
  title: string;
  start_date: string;
};

export function buildEventNotifications({
  events,
  today = new Date(),
}: {
  events: CenterEventInput[];
  today?: Date;
}): AppNotification[] {
  return events
    .filter((event) => {
      const daysUntil = daysBetween(today, parseLocalDate(event.start_date));
      return daysUntil >= 0 && daysUntil <= EVENT_UPCOMING_WINDOW_DAYS;
    })
    .map((event) => {
      const start = parseLocalDate(event.start_date);
      const label = `${start.getMonth() + 1}/${start.getDate()}`;
      return {
        id: `event-${event.id}`,
        category: "event" as const,
        title: `${label} ${event.title}`,
        description: "이번 주 예정된 센터 행사입니다.",
        href: `/events/${event.id}`,
      };
    });
}

export function buildVolunteerExpiryNotifications({
  role,
  lastActivity,
  today = new Date(),
}: {
  role: "mentor" | "volunteer" | "admin";
  lastActivity: Date | null;
  today?: Date;
}): AppNotification[] {
  if (role !== "volunteer" || !lastActivity) return [];

  const daysRemaining =
    VOLUNTEER_EXPIRY_TOTAL_DAYS - daysBetween(lastActivity, today);
  if (daysRemaining < 0 || daysRemaining > VOLUNTEER_EXPIRY_WARN_DAYS) return [];

  return [
    {
      id: "volunteer-expiry",
      category: "volunteer_expiry" as const,
      title: `봉사 활동 기간이 ${daysRemaining}일 남았습니다`,
      description: "활동을 이어가려면 관리자에게 재활성화를 요청하세요.",
      href: "/profile",
    },
  ];
}

export function buildNotifications({
  mentees,
  logsByMentee,
  attendanceByMentee,
  events,
  volunteer,
  today = new Date(),
}: {
  mentees: { id: string; name: string }[];
  logsByMentee: Map<string, SessionLogInput[]>;
  attendanceByMentee: Map<string, AttendanceInput[]>;
  events: CenterEventInput[];
  volunteer: { role: "mentor" | "volunteer" | "admin"; lastActivity: Date | null };
  today?: Date;
}): AppNotification[] {
  return [
    ...buildVolunteerExpiryNotifications({
      role: volunteer.role,
      lastActivity: volunteer.lastActivity,
      today,
    }),
    ...buildDiagnosticsNotifications({ mentees, logsByMentee, attendanceByMentee, today }),
    ...buildEventNotifications({ events, today }),
  ];
}
