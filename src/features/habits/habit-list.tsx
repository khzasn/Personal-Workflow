"use client";

import { useOptimistic } from "react";
import Link from "next/link";
import { Plus, Target } from "lucide-react";
import type { HabitWithTodayStatus } from "@/types";
import { HabitCard } from "./habit-card";

export function HabitList({ initialHabits }: { initialHabits: HabitWithTodayStatus[] }) {
  const [optimisticHabits, addOptimisticUpdate] = useOptimistic<HabitWithTodayStatus[], { id: string; status: HabitWithTodayStatus["todayStatus"] }>(
    initialHabits,
    (state, update) => state.map((h) => (h.id === update.id ? { ...h, todayStatus: update.status } : h))
  );

  return (
    <div className="rounded-[28px] border border-white/60 bg-white/40 p-5 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.02] sm:p-6 mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
            <Target className="h-4 w-4" />
          </div>
          <h3 className="text-base font-extrabold tracking-tight text-foreground">Habit Hari Ini</h3>
        </div>
        <Link
          href="/habits/new"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {optimisticHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-8 text-center">
          <Target className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-muted-foreground">Belum ada habit.</p>
          <p className="text-xs text-muted-foreground/60">Tambahkan habit pertama untuk membangun rutinitas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {optimisticHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onStatusChange={(id, status) => addOptimisticUpdate({ id, status })} />
          ))}
        </div>
      )}
      <div className="mt-3 text-[10px] text-muted-foreground text-center">
        💡 Tip: Swipe ke kanan pada habit untuk menandai "dilewati" (skip).
      </div>
    </div>
  );
}