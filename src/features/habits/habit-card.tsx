"use client";

import { useState, useTransition, useRef } from "react";
import { format } from "date-fns";
import { Check, X, RotateCcw } from "lucide-react";
import type { HabitWithTodayStatus } from "@/types";
import { setHabitStatus } from "./actions";
import Link from "next/link";

export function HabitCard({ habit, onStatusChange }: { habit: HabitWithTodayStatus, onStatusChange: (id: string, status: HabitWithTodayStatus["todayStatus"]) => void }) {
  const [isPending, startTransition] = useTransition();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  const isDone = habit.todayStatus === "done";
  const isSkipped = habit.todayStatus === "skipped";

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = e.touches[0].clientX - touchStartRef.current;
    if (diff > 0 && diff < 100 && !isDone && !isSkipped) { // Only swipe right
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      handleStatusChange("skipped");
    }
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  const handleStatusChange = (newStatus: "done" | "skipped" | "pending") => {
    const today = format(new Date(), "yyyy-MM-dd");
    onStatusChange(habit.id, newStatus); // Optimistic UI
    startTransition(() => {
      void setHabitStatus(habit.id, today, newStatus);
    });
  };

  let bgClass = "bg-white/70 dark:bg-slate-900/50 border-white/60 dark:border-white/10";
  if (isDone) bgClass = "bg-green-500/10 border-green-500/30";
  if (isSkipped) bgClass = "bg-muted/50 border-transparent opacity-60";

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      {/* Background for swipe reveal */}
      <div className="absolute inset-0 flex items-center bg-amber-500/20 px-5 text-amber-600 dark:text-amber-400 font-bold text-xs">
        <span>Dilewati (Skip)</span>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset ? "none" : "transform 0.2s" }}
        className={`relative flex items-center justify-between border px-4 py-3 shadow-xs backdrop-blur-xl transition-all ${bgClass}`}
      >
        <Link href={`/habits/${habit.id}`} className="flex flex-1 items-center gap-3 min-w-0 pr-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background shadow-xs text-lg">
            {habit.emoji}
          </div>
          <div className="min-w-0">
            <h4 className={`truncate text-sm font-bold ${isSkipped ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {habit.title}
            </h4>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Target: {habit.target_value} {habit.target_unit}
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
    </div>
  );
}