"use client";

/**
 * src/features/tasks/deadline-badge.tsx
 * Badge visual untuk status deadline tugas.
 * Menggunakan date-time utility terpusat dari src/lib/date-time.ts.
 */

import { getDeadlineStatus, type DeadlineStatus } from "@/lib/date-time";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface DeadlineBadgeProps {
  deadlineAt: string | null;
  isCompleted: boolean;
  /** Tampilan ringkas tanpa tanggal lengkap */
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  DeadlineStatus,
  { label: (date: Date | null) => string; className: string; icon: string } | null
> = {
  none: null,
  completed: null, // Tugas yang selesai tidak perlu menampilkan peringatan deadline
  upcoming: {
    icon: "📅",
    label: (date) =>
      date ? `Deadline ${format(date, "d MMM", { locale: id })}` : "Mendatang",
    className:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800",
  },
  today: {
    icon: "🔔",
    label: (date) =>
      date ? `Hari ini, ${format(date, "HH:mm")}` : "Hari ini",
    className:
      "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  overdue: {
    icon: "🚨",
    label: (date) =>
      date ? `Terlambat ${format(date, "d MMM", { locale: id })}` : "Terlambat",
    className:
      "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800 animate-pulse",
  },
};

export function DeadlineBadge({
  deadlineAt,
  isCompleted,
  compact = false,
}: DeadlineBadgeProps) {
  const status = getDeadlineStatus(deadlineAt, isCompleted);
  const config = STATUS_CONFIG[status];

  // Tidak render apa pun jika tidak ada deadline atau tugas selesai
  if (!config) return null;

  const date = deadlineAt ? new Date(deadlineAt) : null;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] font-semibold leading-none ${config.className}`}
        title={config.label(date)}
      >
        <span aria-hidden="true">{config.icon}</span>
        {status === "overdue" && "Terlambat"}
        {status === "today" && "Hari ini"}
        {status === "upcoming" && date && format(date, "d MMM", { locale: id })}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label(date)}
    </span>
  );
}
