"use client";

/**
 * src/features/tasks/priority-badge.tsx
 * Badge visual untuk tingkat prioritas tugas.
 * Menggunakan warna + label + ikon (bukan hanya warna).
 */

import type { TaskPriority } from "@/types";

interface PriorityBadgeProps {
  priority: TaskPriority;
  /** Tampilan ringkas (hanya ikon + kode), default false = tampilkan label lengkap */
  compact?: boolean;
}

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; code: string; icon: string; className: string }
> = {
  urgent: {
    label: "Urgent",
    code: "P1",
    icon: "🔴",
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
  },
  high: {
    label: "High",
    code: "P2",
    icon: "🟠",
    className:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900",
  },
  medium: {
    label: "Medium",
    code: "P3",
    icon: "🟣",
    className:
      "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900",
  },
  low: {
    label: "Low",
    code: "P4",
    icon: "⚪",
    className:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
  },
};

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded border px-1 py-0.5 text-[10px] font-bold leading-none ${config.className}`}
        title={`Prioritas: ${config.label}`}
      >
        <span aria-hidden="true">{config.icon}</span>
        {config.code}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${config.className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.code} {config.label}
    </span>
  );
}
