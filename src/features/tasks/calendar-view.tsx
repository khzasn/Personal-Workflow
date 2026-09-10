"use client";

import { useState, useRef } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import type { Task, TaskCategory } from "@/types";

interface CalendarViewProps {
  tasks: Task[];
  onSelectDate: (dateStr: string) => void;
}

// Category color mapping
const categoryColors: Record<TaskCategory, string> = {
  Kerja:
    "border-blue-200/80 bg-blue-50/80 text-blue-900 border-l-2 border-l-blue-500 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-200",
  Belajar:
    "border-emerald-200/80 bg-emerald-50/80 text-emerald-900 border-l-2 border-l-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200",
  Pribadi:
    "border-purple-200/80 bg-purple-50/80 text-purple-900 border-l-2 border-l-purple-500 dark:bg-purple-950/40 dark:border-purple-800/60 dark:text-purple-200",
  Lainnya:
    "border-amber-200/80 bg-amber-50/80 text-amber-900 border-l-2 border-l-amber-500 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200",
};

const priorityDots: Record<string, string> = {
  urgent: "bg-red-500 ring-1 ring-red-400/50",
  high: "bg-orange-500 ring-1 ring-orange-400/50",
  medium: "bg-violet-500",
  low: "bg-slate-400",
};

export function CalendarView({ tasks, onSelectDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  function handlePrevMonth() {
    setSlideDirection("right");
    setCurrentMonth((prev) => subMonths(prev, 1));
  }

  function handleNextMonth() {
    setSlideDirection("left");
    setCurrentMonth((prev) => addMonths(prev, 1));
  }

  function handleToday() {
    setSlideDirection(null);
    setCurrentMonth(new Date());
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextMonth();
    } else if (isRightSwipe) {
      handlePrevMonth();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  // Calculate calendar days matrix (Monday as week start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDayHeaders = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div
      className="animate-fade-up overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_24px_80px_-40px_rgba(76,29,149,0.4)] backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.04]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar Navigation Header */}
      <div className="flex flex-col gap-4 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </h2>
          <span className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary sm:inline-flex">
            <Sparkles className="h-3 w-3" />
            Klik tanggal untuk kelola
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToday}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Hari Ini
          </button>
          <div className="flex items-center rounded-lg border border-input bg-background p-0.5">
            <button
              onClick={handlePrevMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2.5">
        {weekDayHeaders.map((day, idx) => (
          <div key={idx} className={idx >= 5 ? "text-destructive/70" : ""}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid with Slide Transition Container */}
      <div className="relative overflow-hidden bg-muted/10">
        <div
          key={currentMonth.toISOString()}
          className={`grid grid-cols-7 divide-x divide-y divide-border/60 transition-all duration-300 ease-out ${
            slideDirection === "left"
              ? "animate-in slide-in-from-right-4 fade-in-80"
              : slideDirection === "right"
              ? "animate-in slide-in-from-left-4 fade-in-80"
              : ""
          }`}
        >
          {calendarDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            // Filter tasks for this exact day
            const dayTasks = tasks.filter((t) => t.scheduled_date === dateStr);
            const activeCount = dayTasks.filter((t) => !t.is_completed).length;

            return (
              <div
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`group relative min-h-23.75 cursor-pointer select-none flex-col justify-between p-2.5 transition-all duration-200 sm:min-h-28.75 ${
                  !isCurrentMonth
                    ? "bg-muted/20 text-muted-foreground/40"
                    : "bg-white/40 hover:z-10 hover:-translate-y-0.5 hover:bg-primary/[0.04] hover:shadow-lg dark:bg-transparent"
                } ${isCurrentDay ? "bg-primary/[0.06] ring-2 ring-inset ring-primary/40" : ""}`}
              >
                {/* Top Cell: Date Number & Add button */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-105 ${
                      isCurrentDay
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    aria-label={`Tambah tugas untuk ${dateStr}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Middle Cell: Tasks chips list (up to 2 visible + counter) */}
                <div className="flex-1 my-1.5 space-y-1 overflow-hidden">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-1.5 truncate rounded-lg border px-2 py-1 text-[10px] 
                      font-bold leading-tight shadow-sm ${
                         categoryColors[task.category] ||
                         "bg-muted text-muted-foreground"
                        } ${task.is_completed
                          ? "line-through opacity-50"
                          : ""
                        }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          priorityDots[task.priority] ?? "bg-violet-500"
                        }`}
                        title={`Prioritas: ${task.priority}`}
                      />
                      {task.start_time && (
                        <span className="shrink-0 font-bold opacity-70">
                          {task.start_time.slice(0, 5)}
                        </span>
                      )}
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}

                  {dayTasks.length > 2 && (
                    <p className="text-[10px] font-semibold text-muted-foreground pl-1">
                      +{dayTasks.length - 2} lainnya
                    </p>
                  )}
                </div>

                {/* Bottom Cell: Active task indicator dot for mobile view */}
                {activeCount > 0 && (
                  <div className="sm:hidden flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] text-muted-foreground">{activeCount}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
