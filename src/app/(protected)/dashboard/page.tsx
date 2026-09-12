import { Suspense, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardCalendar } from "@/features/tasks/dashboard-calendar";
import { FocusProvider } from "@/features/focus/focus-context";
import { AnalyticsSection } from "@/features/analytics/analytics-section";
import {
  getTaskCompletionTrend,
  getCategoryDistribution,
  getFocusWeekStats,
  getActivityHeatmap,
} from "@/features/analytics/queries";
import type { Task, FocusSession } from "@/types";
import { CheckCircle2, Flame, Sparkles, Timer } from "lucide-react";
import { ReminderProvider } from "@/features/reminders/reminder-context";
import { ReminderBell } from "@/features/reminders/reminder-bell";
import { AlarmBanner } from "@/features/reminders/alarm-banner";
import { getTodayHabits } from "@/features/habits/actions";
import { HabitList } from "@/features/habits/habit-list";

export const metadata = {
  title: "Dayflow | Dashboard",
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
      <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
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

  const allTasks = (tasks || []) as Task[];
  const activeTasks = allTasks.filter((task) => !task.is_completed);
  const completedTasks = allTasks.filter((task) => task.is_completed);
  const totalActiveMinutes = activeTasks.reduce(
    (total, task) => total + task.estimated_minutes,
    0
  );
  const totalTasksCount = allTasks.length;
  const completionRate =
    totalTasksCount > 0
      ? Math.round((completedTasks.length / totalTasksCount) * 100)
      : 0;

  // Salam dinamis
  const currentHour = new Date().getHours();
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
    .select(`*, task:tasks (id, title, category, priority)`)
    .eq("user_id", user?.id)
    .in("status", ["running", "paused"])
    .maybeSingle();

  const [completionTrend, categoryDistribution, focusWeekStats, activityHeatmap, todayHabits] =
    await Promise.all([
      getTaskCompletionTrend(7),
      getCategoryDistribution(),
      getFocusWeekStats(7),
      getActivityHeatmap(12),
      getTodayHabits(),
    ]);

  return (
    <FocusProvider initialSession={activeFocus as unknown as FocusSession | null}>
      <ReminderProvider tasks={allTasks}>
        <AlarmBanner />

        {/* ReminderBell ditempatkan di dalam header layout via fixed positioning */}
        <div className="fixed top-[14px] right-[108px] z-40 sm:right-[120px] md:right-[190px]">
          <ReminderBell />
        </div>

        <div className="min-h-full pb-20">
          <div className="container mx-auto max-w-5xl space-y-7 px-4 pt-6 sm:px-6 sm:pt-8">

            {/* Greeting + Stats */}
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

            {/* Habit Hari Ini */}
            <section>
              <HabitList initialHabits={todayHabits} />
            </section>

            {/* ② Analitik Produktivitas */}
            <section>
              <AnalyticsSection
                completionTrend={completionTrend}
                categoryDistribution={categoryDistribution}
                focusWeekStats={focusWeekStats}
                activityHeatmap={activityHeatmap}
              />
            </section>

            {/* ③ Kalender / Jadwal */}
            <section>
              <Suspense fallback={<div className="h-96 animate-pulse rounded-[28px] bg-muted/30" />}>
                <DashboardCalendar tasks={allTasks} />
              </Suspense>
            </section>

          </div>
        </div>
      </ReminderProvider>
    </FocusProvider>
  );
}
