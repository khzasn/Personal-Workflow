import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { DashboardCalendar } from "@/features/tasks/dashboard-calendar";
import { FocusProvider } from "@/features/focus/focus-context";
import type { Task, FocusSession } from "@/types";
import { CalendarDays } from "lucide-react";

export const metadata = {
  title: "Dayflow | Jadwal",
};

export const dynamic = "force-dynamic";

export default async function JadwalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  const allTasks = (tasks || []) as Task[];

  const { data: activeFocus } = await supabase
    .from("focus_sessions")
    .select(`*, task:tasks (id, title, category, priority)`)
    .eq("user_id", user?.id)
    .in("status", ["running", "paused"])
    .maybeSingle();

  return (
    <FocusProvider initialSession={activeFocus as unknown as FocusSession | null}>
      <div className="min-h-full pb-20">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-8">

          {/* Page Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Jadwal
              </h1>
              <p className="text-xs text-muted-foreground">
                Atur dan pantau semua tugasmu dalam tampilan kalender.
              </p>
            </div>
          </div>

          {/* Calendar */}
          <Suspense
            fallback={<div className="h-96 animate-pulse rounded-[28px] bg-muted/30" />}
          >
            <DashboardCalendar tasks={allTasks} />
          </Suspense>

        </div>
      </div>
    </FocusProvider>
  );
}
