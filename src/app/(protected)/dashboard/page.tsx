import { Suspense, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardCalendar } from "@/features/tasks/dashboard-calendar";
import { BriefingList } from "@/features/briefings/briefing-list";
import { FocusProvider } from "@/features/focus/focus-context";
import { AnalyticsSection } from "@/features/analytics/analytics-section";
import {
  getTaskCompletionTrend,
  getCategoryDistribution,
  getFocusWeekStats,
  getActivityHeatmap,
} from "@/features/analytics/queries";
import type { Task, Briefing, FocusSession } from "@/types";
import {
  CalendarCheck2,
  CheckCircle2,
  Flame,
  LogOut,
  Sparkles,
  Timer,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReminderProvider } from "@/features/reminders/reminder-context";
import { ReminderBell } from "@/features/reminders/reminder-bell";
import { AlarmBanner } from "@/features/reminders/alarm-banner";
import { signOut } from "@/features/auth/actions";

export const metadata = {
  title: "Dayflow | Personal Productivity Dashboard",
};

export const dynamic = "force-dynamic";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/70 bg-white/70 p-3 shadow-xs backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm dark:border-white/5 dark:bg-white/[0.04] sm:p-3.5">
      <div
        className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl ${color}`}
      >
        {icon}
      </div>

      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: briefings } = await supabase
    .from("briefings")
    .select("*")
    .order("published_at", { ascending: false });

  const allTasks = (tasks || []) as Task[];

  const activeTasks = allTasks.filter(
    (task) => !task.is_completed
  );

  const completedTasks = allTasks.filter(
    (task) => task.is_completed
  );

  const totalActiveMinutes = activeTasks.reduce(
    (total, task) =>
      total + task.estimated_minutes,
    0
  );

  const totalTasksCount = allTasks.length;
  const completionRate =
    totalTasksCount > 0
      ? Math.round((completedTasks.length / totalTasksCount) * 100)
      : 0;

  // Waktu & salam dinamis
  const now = new Date();
  const currentHour = now.getHours();
  let greeting = "Selamat Pagi";
  let greetingEmoji = "☀️";
  if (currentHour >= 11 && currentHour < 15) {
    greeting = "Selamat Siang";
    greetingEmoji = "🌤️";
  } else if (currentHour >= 15 && currentHour < 18) {
    greeting = "Selamat Sore";
    greetingEmoji = "🌇";
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = "Selamat Malam";
    greetingEmoji = "🌙";
  }

  const { data: activeFocus } = await supabase
    .from("focus_sessions")
    .select(`
      *,
      task:tasks (
        id,
        title,
        category,
        priority
      )
    `)
    .eq("user_id", user?.id)
    .in("status", ["running", "paused"])
    .maybeSingle();

  // Fetch analytics data secara paralel
  const [completionTrend, categoryDistribution, focusWeekStats, activityHeatmap] =
    await Promise.all([
      getTaskCompletionTrend(7),
      getCategoryDistribution(),
      getFocusWeekStats(7),
      getActivityHeatmap(12),
    ]);

  return (
    <FocusProvider initialSession={activeFocus as unknown as FocusSession | null}>
      <ReminderProvider tasks={allTasks}>
        <AlarmBanner />
        <div className="min-h-screen bg-transparent pb-20">
        <header className="sticky top-0 z-30 border-b border-white/50 bg-background/75 backdrop-blur-xl dark:border-white/5">
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                <CalendarCheck2 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-sm font-extrabold tracking-tight sm:text-base">
                  Dayflow
                </h1>

                <p className="hidden text-[11px] text-muted-foreground sm:block">
                  Susun waktu. Jalani dengan tenang ✦
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden rounded-full border bg-white/60 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur dark:bg-white/5 md:inline">
                {user?.email}
              </span>

              <ReminderBell />
              <ThemeToggle />

              <form action={signOut}>
                <button
                  type="submit"
                  aria-label="Keluar"
                  title="Keluar dari akun"
                  className="flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-muted hover:text-foreground sm:px-3"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </form>
            </div>
          </div>
        </header>

      <main className="container mx-auto max-w-7xl space-y-7 px-4 pt-6 sm:px-6 sm:pt-8">
        <section className="animate-fade-up overflow-hidden rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Ruang produktifmu
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {greeting} {greetingEmoji},{" "}
                <span>{user?.email?.split("@")[0]}!</span>
              </h2>

              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Sedikit kemajuan hari ini tetap berarti. Yuk, susun waktumu dan mulai satu per satu.
              </p>

              {/* Progress Bar Penyelesaian Tugas */}
              <div className="mt-3.5 max-w-md space-y-1.5 rounded-xl border border-border/60 bg-background/50 p-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Progress Hari Ini ({completedTasks.length}/{totalTasksCount} selesai)</span>
                  <span className="font-bold text-foreground">{completionRate}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.max(completionRate, totalTasksCount === 0 ? 0 : 4)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 4 Clean Stat Cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:w-auto">
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label="Aktif"
                value={activeTasks.length}
                color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
              />

              <StatCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Selesai"
                value={completedTasks.length}
                color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />

              <StatCard
                icon={<Timer className="h-4 w-4" />}
                label="Fokus"
                value={`${totalActiveMinutes}m`}
                color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              />

              <StatCard
                icon={<Sparkles className="h-4 w-4" />}
                label="Skor"
                value={`${completionRate}%`}
                color="bg-primary/10 text-primary"
              />
            </div>
          </div>
        </section>

        <section>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-[28px] bg-muted/30" />}>
            <DashboardCalendar tasks={allTasks} />
          </Suspense>
        </section>

        <section>
          <AnalyticsSection
            completionTrend={completionTrend}
            categoryDistribution={categoryDistribution}
            focusWeekStats={focusWeekStats}
            activityHeatmap={activityHeatmap}
          />
        </section>

        <section className="pt-2">
          <BriefingList
            briefings={
              (briefings || []) as Briefing[]
            }
          />
        </section>
      </main>
    </div>
      </ReminderProvider>
  </FocusProvider>
  );
}