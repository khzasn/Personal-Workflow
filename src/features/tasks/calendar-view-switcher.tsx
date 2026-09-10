"use client";

/**
 * src/features/tasks/calendar-view-switcher.tsx
 * Komponen pemilih tampilan kalender: Month, Week, Day.
 * Mengikuti tema Dayflow dengan animasi transisi pill halus.
 */

import { Calendar, CalendarDays, Clock } from "lucide-react";

export type CalendarViewMode = "month" | "week" | "day";

interface CalendarViewSwitcherProps {
  currentView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
}

const VIEWS: { id: CalendarViewMode; label: string; icon: typeof Calendar }[] = [
  { id: "month", label: "Month", icon: Calendar },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "day", label: "Day", icon: Clock },
];

export function CalendarViewSwitcher({
  currentView,
  onViewChange,
}: CalendarViewSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-2xl border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-white/5 dark:bg-white/5">
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
