import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/top-nav";
import { buildNotifications, type AppNotification } from "@/lib/notifications";
import type { AttendanceInput, SessionLogInput } from "@/lib/learning-diagnostics";
import "./globals.css";

function todayDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "새싹 다이어리",
  description: "커뮤니티 지역아동센터 멘토링 코파일럿",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileInitial: string | undefined;
  let notifications: AppNotification[] = [];

  if (user) {
    const { data: mentor } = await supabase
      .from("mentors")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle();
    const name = mentor?.name?.trim();
    profileInitial = name && !name.includes("@") ? name[0] : undefined;

    const { data: mentees } = await supabase
      .from("mentees")
      .select("id, name")
      .order("name");
    const menteeIds = (mentees ?? []).map((mentee) => mentee.id);

    const { data: logRows } = menteeIds.length
      ? await supabase
          .from("session_logs")
          .select("mentee_id, session_date, subject")
          .in("mentee_id", menteeIds)
      : { data: [] };

    const { data: attendanceRows } = menteeIds.length
      ? await supabase
          .from("attendance")
          .select("mentee_id, session_date, status")
          .in("mentee_id", menteeIds)
      : { data: [] };

    const { data: eventRows } = await supabase
      .from("center_events")
      .select("id, title, start_date")
      .gte("end_date", todayDateString(new Date()));

    const { data: lastActivity } = await supabase.rpc("mentor_last_activity", {
      p_mentor_id: user.id,
    });

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

    notifications = buildNotifications({
      mentees: mentees ?? [],
      logsByMentee,
      attendanceByMentee,
      events: eventRows ?? [],
      volunteer: {
        role: mentor?.role ?? "mentor",
        lastActivity: lastActivity ? new Date(lastActivity) : null,
      },
    });
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {user && (
          <TopNav profileInitial={profileInitial} notifications={notifications} />
        )}
        {children}
      </body>
    </html>
  );
}
