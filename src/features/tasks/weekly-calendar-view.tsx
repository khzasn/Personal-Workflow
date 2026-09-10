"use client";

/**
 * src/features/tasks/weekly-calendar-view.tsx
 * Tampilan kalender mingguan (Weekly View) dengan time-blocked grid 7 hari,
 * penanganan overlapping tasks, indikator waktu nyata (current time indicator),
 * interaksi Drag-to-Move & Drag-to-Resize (Phase 2.1), dan dukungan responsif.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Loader2,
  Repeat,
} from "lucide-react";
import type { Task, TaskCategory } from "@/types";
import { PriorityBadge } from "./priority-badge";
import { DeadlineBadge } from "./deadline-badge";
import { calculateOverlappingColumns } from "@/lib/tasks/layout";
import { timeToMinutes } from "@/lib/date-time";
import { useCalendarDrag } from "./use-calendar-drag";

interface WeeklyCalendarViewProps {
  tasks: Task[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onOpenCreateModal: (dateStr: string, startTime?: string) => void;
  onOpenTaskDetail: (dateStr: string) => void;
  onViewDay: (dateStr: string) => void;
}

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 56; // 56px per hour
const TIME_GUTTER_WIDTH = 52; // 52px for time labels on left

const categoryColors: Record<TaskCategory, string> = {
  Kerja:
    "border-blue-200/80 bg-blue-50/90 text-blue-950 border-l-[3px] border-l-blue-500 dark:border-blue-800/80 dark:bg-blue-950/50 dark:text-blue-100 shadow-2xs",
  Belajar:
    "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 border-l-[3px] border-l-emerald-500 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-100 shadow-2xs",
  Pribadi:
    "border-purple-200/80 bg-purple-50/90 text-purple-950 border-l-[3px] border-l-purple-500 dark:border-purple-800/80 dark:bg-purple-950/50 dark:text-purple-100 shadow-2xs",
  Lainnya:
    "border-amber-200/80 bg-amber-50/90 text-amber-950 border-l-[3px] border-l-amber-500 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-100 shadow-2xs",
};

export function WeeklyCalendarView({
  tasks,
  currentDate,
  onDateChange,
  onOpenCreateModal,
  onOpenTaskDetail,
  onViewDay,
}: WeeklyCalendarViewProps) {
  const [now, setNow] = useState<Date | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Update current time indicator every minute
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Hitung rentang 7 hari dalam minggu berjalan (Senin - Minggu)
  const weekDays = useMemo(() => {
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [currentDate]);

  // Hook untuk drag and resize interaktif
  const { dragPreview, isSaving, startDrag, onPointerMove, onPointerUp } =
    useCalendarDrag({
      startHour: START_HOUR,
      endHour: END_HOUR,
      hourHeight: HOUR_HEIGHT,
      weekDays,
    });

  // Total jam di timeline (06:00 - 22:00)
  const hours = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  }, []);

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  // Scroll otomatis ke jam saat ini saat pertama kali dibuka
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const currentHour = new Date().getHours();
    if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
      const scrollOffset = (currentHour - START_HOUR) * HOUR_HEIGHT - 60;
      scrollContainerRef.current.scrollTo({ top: Math.max(0, scrollOffset), behavior: "smooth" });
    }
  }, []);

  function handlePrevWeek() {
    onDateChange(subWeeks(currentDate, 1));
  }

  function handleNextWeek() {
    onDateChange(addWeeks(currentDate, 1));
  }

  function handleToday() {
    onDateChange(new Date());
  }

  // Label rentang minggu untuk header (misal: "8 - 14 Sep 2026")
  const weekLabel = useMemo(() => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${format(firstDay, "d")} - ${format(lastDay, "d MMMM yyyy", { locale: id })}`;
    }
    return `${format(firstDay, "d MMM", { locale: id })} - ${format(lastDay, "d MMM yyyy", { locale: id })}`;
  }, [weekDays]);

  // Current time position
  const currentMinutes = now ? now.getHours() * 60 + now.getMinutes() : null;
  const currentTimeTop =
    currentMinutes !== null && currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60
      ? ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
      : null;

  return (
    <div className="animate-fade-up overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_24px_80px_-40px_rgba(76,29,149,0.4)] backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.04]">
      {/* Header Navigasi Mingguan */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 p-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl capitalize">
                {weekLabel}
              </h2>
              {isSaving && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Menyimpan…
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Geser kartu untuk ubah jam/hari · Tarik bagian bawah kartu untuk ubah durasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Hari Ini
          </button>
          <div className="flex items-center rounded-lg border border-input bg-background p-0.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Minggu sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Minggu berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Header Kolom 7 Hari (Sticky di atas saat scroll) */}
      <div className="grid grid-cols-[52px_repeat(7,minmax(110px,1fr))] border-b bg-muted/40 text-xs font-semibold text-muted-foreground overflow-x-auto">
        <div className="border-r border-border/40 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          Jam
        </div>
        {weekDays.map((day) => {
          const isDayToday = isToday(day);
          const dateStr = format(day, "yyyy-MM-dd");
          return (
            <div
              key={dateStr}
              onClick={() => onViewDay(dateStr)}
              className={`group cursor-pointer border-r border-border/40 py-2 px-1 text-center transition-colors hover:bg-primary/[0.04] ${
                isDayToday ? "bg-primary/[0.06] text-primary" : ""
              }`}
              title="Klik untuk membuka tampilan harian"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                {format(day, "EEE", { locale: id })}
              </p>
              <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-transform group-hover:scale-110">
                <span
                  className={
                    isDayToday
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground"
                  }
                >
                  {format(day, "d")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bagian Atas: Tugas Tanpa Jam (Unscheduled / All-Day) */}
      <div className="grid grid-cols-[52px_repeat(7,minmax(110px,1fr))] border-b border-dashed border-border/60 bg-muted/20 text-xs overflow-x-auto">
        <div className="flex items-center justify-center border-r border-border/40 py-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
          All-day
        </div>
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const unscheduled = tasks.filter(
            (t) => t.scheduled_date === dateStr && !t.start_time
          );

          return (
            <div
              key={dateStr}
              className="border-r border-border/40 p-1 min-h-[36px] flex flex-col gap-1"
            >
              {unscheduled.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskDetail(dateStr)}
                  className={`cursor-pointer truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-tight transition-all hover:brightness-95 ${
                    categoryColors[task.category] || "bg-muted"
                  } ${task.is_completed ? "line-through opacity-50" : ""}`}
                >
                  {task.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Area Timeline Grid dengan Scroll Vertikal */}
      <div
        ref={scrollContainerRef}
        className="pretty-scrollbar relative overflow-x-auto overflow-y-auto"
        style={{ maxHeight: "600px" }}
      >
        <div
          ref={gridRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="grid grid-cols-[52px_repeat(7,minmax(110px,1fr))] relative touch-none"
          style={{ height: totalHeight }}
        >
          {/* Garis Horizontal Jam & Kolom Jam Kiri */}
          {hours.map((hour, idx) => (
            <div
              key={hour}
              className="absolute inset-x-0 border-t border-border/40 pointer-events-none"
              style={{ top: idx * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <span className="absolute left-0 top-0 w-12 -translate-y-1/2 pr-2 text-right text-[10px] font-semibold tabular-nums text-muted-foreground/70">
                {String(hour).padStart(2, "0")}:00
              </span>
              {/* Garis pemisah 30 menit (dashed) */}
              <div
                className="absolute inset-x-0 border-t border-dashed border-border/20"
                style={{ top: HOUR_HEIGHT / 2, left: TIME_GUTTER_WIDTH }}
              />
            </div>
          ))}

          {/* Kolom Waktu (Gutter Kiri) */}
          <div className="border-r border-border/40" />

          {/* Kolom Tiap Hari (7 Kolom) */}
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isDayToday = isToday(day);
            const dayTasks = tasks.filter((t) => t.scheduled_date === dateStr && t.start_time);
            const columnLayouts = calculateOverlappingColumns(dayTasks);

            return (
              <div
                key={dateStr}
                className={`relative border-r border-border/40 transition-colors ${
                  isDayToday ? "bg-primary/[0.02]" : ""
                }`}
                style={{ height: totalHeight }}
                onClick={(e) => {
                  // Cek apakah klik berasal dari kartu tugas (jika ya, jangan buka composer)
                  if ((e.target as HTMLElement).closest("[data-task-card]")) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = Math.max(0, Math.min(e.clientY - rect.top, totalHeight - 1));
                  const minutesFromStart = Math.floor((offsetY / HOUR_HEIGHT) * 60 / 30) * 30;
                  const totalMinutes = START_HOUR * 60 + minutesFromStart;
                  const h = Math.floor(totalMinutes / 60);
                  const m = totalMinutes % 60;
                  const timeString = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                  onOpenCreateModal(dateStr, timeString);
                }}
              >
                {/* Indikator Waktu Sekarang (Hanya di hari ini) */}
                {isDayToday && currentTimeTop !== null && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    style={{ top: currentTimeTop }}
                  >
                    <span className="h-2 w-2 -ml-1 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                    <span className="h-[2px] flex-1 bg-rose-500/80" />
                  </div>
                )}

                {/* Kartu Tugas Time-blocked dengan Drag and Resize Handles */}
                {dayTasks.map((task) => {
                  const startMin = timeToMinutes(task.start_time!);
                  const visibleStart = Math.max(startMin, START_HOUR * 60);
                  const top = ((visibleStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                  const duration = Math.max(task.estimated_minutes, 15);
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 26);

                  const layout = columnLayouts.get(task.id) ?? { column: 0, totalColumns: 1 };
                  const widthPercent = 100 / layout.totalColumns;
                  const leftPercent = layout.column * widthPercent;
                  const isBeingDragged = dragPreview?.task.id === task.id;

                  return (
                    <article
                      key={task.id}
                      data-task-card
                      onPointerDown={(e) => startDrag(task, "move", e, gridRef.current!)}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Hanya buka detail jika bukan drag
                        onOpenTaskDetail(dateStr);
                      }}
                      className={`group absolute z-10 cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-lg border-l-3 p-1.5 shadow-xs transition hover:z-30 hover:shadow-md hover:brightness-95 ${
                        categoryColors[task.category] || "bg-muted"
                      } ${task.is_completed ? "opacity-60 border-slate-300 line-through" : ""} ${
                        isBeingDragged ? "opacity-30 border-dashed" : ""
                      }`}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                      }}
                    >
                      <div className="flex flex-col h-full justify-between pointer-events-none">
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <p className="truncate text-[11px] font-bold leading-tight">
                                {task.title}
                              </p>
                              {task.series_id && (
                                <Repeat className="h-2.5 w-2.5 shrink-0 text-primary opacity-80" />
                              )}
                            </div>
                            <GripVertical className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-80" />
                          </div>
                          {height >= 40 && (
                            <p className="mt-0.5 truncate text-[9px] font-medium opacity-70">
                              {task.start_time?.slice(0, 5)} · {task.estimated_minutes}m
                            </p>
                          )}
                        </div>

                        {/* Badges bila tinggi kartu mencukupi */}
                        {height >= 56 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <PriorityBadge priority={task.priority} compact />
                            <DeadlineBadge
                              deadlineAt={task.deadline_at}
                              isCompleted={task.is_completed}
                              compact
                            />
                          </div>
                        )}
                      </div>

                      {/* Resize Handle di tepi bawah kartu */}
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(task, "resize", e, gridRef.current!);
                        }}
                        className="absolute bottom-0 inset-x-0 h-2.5 cursor-s-resize hover:bg-black/15 dark:hover:bg-white/20 transition-colors z-20"
                        title="Tarik untuk mengubah durasi"
                      />
                    </article>
                  );
                })}
              </div>
            );
          })}

          {/* Bayangan Pratinjau (Drag / Resize Preview Overlay) */}
          {dragPreview && (
            <div
              className="pointer-events-none absolute z-40 rounded-lg border-2 border-primary bg-primary/20 shadow-2xl backdrop-blur-xs transition-none ring-2 ring-primary/30"
              style={{
                top: dragPreview.top,
                height: dragPreview.height,
                left: `calc(${TIME_GUTTER_WIDTH}px + (${dragPreview.dayIndex} * (100% - ${TIME_GUTTER_WIDTH}px) / 7) + 2px)`,
                width: `calc((100% - ${TIME_GUTTER_WIDTH}px) / 7 - 4px)`,
              }}
            >
              <div className="p-1.5 text-primary font-bold text-[11px]">
                <p className="truncate">{dragPreview.task.title}</p>
                <p className="text-[10px] font-bold opacity-90">
                  {dragPreview.targetStartTime} · {dragPreview.targetDuration} menit
                </p>
                <span className="text-[9px] uppercase tracking-wider opacity-75">
                  {dragPreview.mode === "resize" ? "Mengubah durasi" : "Memindahkan jadwal"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
