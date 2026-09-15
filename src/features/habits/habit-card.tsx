"use client";

import { useTransition } from "react";
import { format, subDays } from "date-fns";
import { Check, RotateCcw } from "lucide-react";
import type { HabitWithTodayStatus, HabitCompletion } from "@/types";
import { setHabitStatus } from "./actions";
import Link from "next/link";
import { motion, useAnimation, PanInfo } from "framer-motion";

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function WeeklyBar({ weekCompletions }: { weekCompletions: HabitCompletion[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const log = weekCompletions.find((c) => c.completed_date === dateStr);
    const isToday = i === 6;
    const dayOfWeek = (date.getDay() + 6) % 7; 
    return { dateStr, log, isToday, label: DAY_LABELS[dayOfWeek] };
  });

  return (
    <div className="mt-3 flex items-center gap-1.5">
      {days.map(({ dateStr, log, isToday, label }) => {
        let dotClass = "bg-border/40"; 
        if (log?.status === "done") dotClass = "bg-emerald-500";
        if (log?.status === "skipped") dotClass = "bg-muted-foreground/30";

        return (
          <div key={dateStr} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`h-2 w-full rounded-full transition-all ${dotClass} ${isToday ? "ring-2 ring-offset-1 ring-primary/50 ring-offset-background" : ""}`}
            />
            <span className={`text-[9px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground/60"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function HabitCard({ habit, onStatusChange }: { habit: HabitWithTodayStatus; onStatusChange: (id: string, status: HabitWithTodayStatus["todayStatus"]) => void }) {
  const [isPending, startTransition] = useTransition();
  const controls = useAnimation();

  const isDone = habit.todayStatus === "done";
  const isSkipped = habit.todayStatus === "skipped";

  const handleStatusChange = (newStatus: "done" | "skipped" | "pending") => {
    const today = format(new Date(), "yyyy-MM-dd");
    onStatusChange(habit.id, newStatus);
    startTransition(() => {
      void setHabitStatus(habit.id, today, newStatus);
    });
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // If swiped right far enough or fast enough
    if ((offset > 100 || velocity > 500) && !isDone && !isSkipped) {
      handleStatusChange("skipped");
    }
    
    // Snap back to original position with spring animation
    controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
  };

  let bgClass = "bg-white/70 dark:bg-slate-900/50 border-white/60 dark:border-white/10";
  if (isDone) bgClass = "bg-emerald-500/10 border-emerald-500/30";
  if (isSkipped) bgClass = "bg-muted/50 border-transparent opacity-60";

  const doneCount = habit.weekCompletions.filter((c) => c.status === "done").length;

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      {/* Swipe background indicating the action */}
      <div className="absolute inset-0 flex items-center bg-amber-500/20 px-5 text-amber-600 dark:text-amber-400 font-bold text-xs">
        <span>Dilewati (Skip)</span>
      </div>

      <motion.div
        drag={isDone || isSkipped ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileHover={!isDone && !isSkipped ? { scale: 1.02 } : {}}
        whileTap={!isDone && !isSkipped ? { scale: 0.98 } : {}}
        className={`relative border px-4 py-3 shadow-xs backdrop-blur-xl ${bgClass} touch-none`}
      >
        {/* Top row: emoji + title + action */}
        <div className="flex items-center gap-3">
          <Link href={`/habits/${habit.id}`} className="flex flex-1 items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background shadow-xs text-lg">
              {habit.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`truncate text-sm font-bold ${isSkipped ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {habit.title}
              </h4>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Target: {habit.target_value} {habit.target_unit}
                {doneCount > 0 && (
                  <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">· {doneCount}✓ minggu ini</span>
                )}
              </p>
            </div>
          </Link>

          {isDone || isSkipped ? (
            <button
              onClick={() => handleStatusChange("pending")}
              disabled={isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground hover:bg-muted shadow-xs transition-colors"
              title="Batalkan"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange("done")}
              disabled={isPending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-xs transition-colors"
              title="Selesai"
            >
              <Check className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Weekly bar */}
        <WeeklyBar weekCompletions={habit.weekCompletions} />
      </motion.div>
    </div>
  );
}