import type { Metadata } from "next";
import { Noto_Sans_KR, Nunito_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";
import { buildNotifications, type AppNotification } from "@/lib/notifications";
import { getMenteeDiagnosticsData } from "@/lib/mentee-diagnostics-data";
import "./globals.css";

function todayDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const nunitoSans = Nunito_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "새싹 다이어리",
  description: "온새미로지역아동센터 멘토링 코파일럿",
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
  let isAdmin = false;

  if (user) {
    const [
      { data: mentor },
      { mentees, logsByMentee, attendanceByMentee },
      { data: eventRows },
      { data: lastActivity },
    ] = await Promise.all([
      supabase.from("mentors").select("name, role").eq("id", user.id).maybeSingle(),
      getMenteeDiagnosticsData(),
      supabase
        .from("center_events")
        .select("id, title, start_date")
        .gte("end_date", todayDateString(new Date())),
      supabase.rpc("mentor_last_activity", { p_mentor_id: user.id }),
    ]);

    const name = mentor?.name?.trim();
    profileInitial = name && !name.includes("@") ? name[0] : undefined;
    isAdmin = mentor?.role === "admin";

    notifications = buildNotifications({
      mentees,
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
      className={`${nunitoSans.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-stone-50">
        {user ? (
          <div className="flex min-h-full">
            <SidebarNav isAdmin={isAdmin} />
            <div className="flex min-h-full flex-1 flex-col lg:pl-64">
              <Topbar profileInitial={profileInitial} notifications={notifications} />
              <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
            </div>
            <BottomNav isAdmin={isAdmin} />
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
