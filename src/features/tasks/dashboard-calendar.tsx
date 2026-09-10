"use client";

/**
 * src/features/tasks/dashboard-calendar.tsx
 * Komponen orkestrator kalender utama yang mengelola:
 * - View Switcher: Month | Week | Day
 * - URL State Synchronization (?view=week&date=YYYY-MM-DD)
 * - Transisi antara tampilan kalender bulanan, mingguan, dan drawer agenda harian
 */

import { useCallback, useEffect, useMemo, useState, useOptimistic } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  addDays,
  format,
  isValid,
  parseISO,
  subDays,
} from "date-fns";
import type { Task } from "@/types";
import { CalendarView } from "./calendar-view";
import { WeeklyCalendarView } from "./weekly-calendar-view";
import { TaskDrawer } from "./task-drawer";
import { NlQuickInput } from "./nl-quick-input";
import {
  CalendarViewSwitcher,
  type CalendarViewMode,
} from "./calendar-view-switcher";

interface DashboardCalendarProps {
  tasks: Task[];
}

export function DashboardCalendar({ tasks }: DashboardCalendarProps) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic<Task[], Task>(
    tasks,
    (state, newTask) => {
      // Jika tugas dengan ID yang sama sudah ada (update), ganti. Jika tidak, tambahkan.
      const exists = state.some((t) => t.id === newTask.id);
      if (exists) {
        return state.map((t) => (t.id === newTask.id ? newTask : t));
      }
      return [newTask, ...state];
    }
  );

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Baca initial view & date dari URL params dengan fallback aman
  const urlView = searchParams.get("view");
  const urlDate = searchParams.get("date");

  const validView: CalendarViewMode = useMemo(() => {
    if (urlView === "week" || urlView === "day" || urlView === "month") {
      return urlView;
    }
    return "month"; // Default fallback
  }, [urlView]);

  const [currentView, setCurrentView] = useState<CalendarViewMode>(validView);

  // Parse tanggal terpilih dari URL atau default hari ini
  const validDate = useMemo(() => {
    if (urlDate) {
      const parsed = parseISO(urlDate);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  }, [urlDate]);

  const [currentDate, setCurrentDate] = useState<Date>(validDate);
  const [isDrawerOpen, setIsDrawerOpen] = useState(validView === "day");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(validDate, "yyyy-MM-dd")
  );
  const [drawerStartTime, setDrawerStartTime] = useState<string | null>(null);

  // 2. Sinkronkan perubahan URL ke state internal saat user klik Back/Forward
  useEffect(() => {
    setCurrentView(validView);
    setCurrentDate(validDate);
    setSelectedDate(format(validDate, "yyyy-MM-dd"));
    if (validView === "day") {
      setIsDrawerOpen(true);
    }
  }, [validView, validDate]);

  // 3. Helper untuk memperbarui URL params secara halus tanpa reload penuh
  const updateUrl = useCallback(
    (view: CalendarViewMode, dateStr: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", view);
      params.set("date", dateStr);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // 4. Handler perubahan tampilan (Month / Week / Day)
  function handleViewChange(newView: CalendarViewMode) {
    setCurrentView(newView);
    const dateStr = format(currentDate, "yyyy-MM-dd");
    updateUrl(newView, dateStr);

    if (newView === "day") {
      setSelectedDate(dateStr);
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
    }
  }

  // 5. Handler navigasi tanggal
  function handleDateChange(newDate: Date) {
    setCurrentDate(newDate);
    const dateStr = format(newDate, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    updateUrl(currentView, dateStr);
  }

  // 6. Handler saat klik tanggal di Month View
  function handleSelectDateFromMonth(dateStr: string) {
    setSelectedDate(dateStr);
    setDrawerStartTime(null);
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) setCurrentDate(parsed);
    setIsDrawerOpen(true);
  }

  // 7. Handler navigasi hari berikutnya/sebelumnya pada Drawer
  function handlePreviousDay() {
    if (!selectedDate) return;
    const newDate = subDays(parseISO(selectedDate), 1);
    const dateStr = format(newDate, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setCurrentDate(newDate);
    updateUrl(currentView, dateStr);
  }

  function handleNextDay() {
    if (!selectedDate) return;
    const newDate = addDays(parseISO(selectedDate), 1);
    const dateStr = format(newDate, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setCurrentDate(newDate);
    updateUrl(currentView, dateStr);
  }

  // 8. Handler klik slot atau tanggal dari Week View
  function handleOpenCreateFromWeek(dateStr: string, startTime?: string) {
    setSelectedDate(dateStr);
    setDrawerStartTime(startTime ?? null);
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) setCurrentDate(parsed);
    setIsDrawerOpen(true);
  }

  function handleViewDayFromWeek(dateStr: string) {
    setSelectedDate(dateStr);
    setDrawerStartTime(null);
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) setCurrentDate(parsed);
    handleViewChange("day");
  }

  return (
    <div className="space-y-4">
      {/* Natural-Language Task Input AI Bar */}
      <NlQuickInput />

      {/* Baris Atas: View Switcher */}
      <div className="flex items-center justify-between">
        <CalendarViewSwitcher
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </div>

      {/* Render Tampilan Kalender Sesuai Mode */}
      {currentView === "month" && (
        <CalendarView
          tasks={optimisticTasks}
          onSelectDate={handleSelectDateFromMonth}
        />
      )}

      {currentView === "week" && (
        <WeeklyCalendarView
          tasks={optimisticTasks}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          onOpenCreateModal={handleOpenCreateFromWeek}
          onOpenTaskDetail={handleSelectDateFromMonth}
          onViewDay={handleViewDayFromWeek}
        />
      )}

      {currentView === "day" && (
        <div className="rounded-[28px] border border-dashed border-primary/30 bg-primary/[0.02] p-8 text-center">
          <p className="text-sm font-semibold text-primary">
            Agenda Harian untuk {selectedDate} terbuka di panel sebelah kanan.
          </p>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Buka Panel Agenda
          </button>
        </div>
      )}

      {/* Drawer Agenda Harian Terintegrasi */}
      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerStartTime(null);
          // Jika ditutup saat mode 'day', kembalikan tampilan ke 'week' atau 'month'
          if (currentView === "day") {
            handleViewChange("week");
          }
        }}
        selectedDate={selectedDate}
        initialStartTime={drawerStartTime}
        tasks={optimisticTasks}
        addOptimisticTask={addOptimisticTask}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
      />
    </div>
  );
}