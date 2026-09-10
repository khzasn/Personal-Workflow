"use client";

/**
 * src/features/focus/focus-session-summary.tsx
 * Modal kesimpulan pencapaian saat sesi fokus selesai,
 * dengan opsi menandai task terkait sebagai selesai.
 */

import { useState } from "react";
import { CheckCircle2, Award, Flame, X } from "lucide-react";
import type { FocusSession } from "@/types";

interface FocusSessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  session: FocusSession;
  onConfirmComplete: (completeTask: boolean) => void;
  isCompleting: boolean;
}

export function FocusSessionSummary({
  isOpen,
  onClose,
  session,
  onConfirmComplete,
  isCompleting,
}: FocusSessionSummaryProps) {
  const [completeTask, setCompleteTask] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 sm:p-7">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Sesi Fokus Selesai! 🎉</h3>
              <p className="text-xs text-muted-foreground">Kerja bagus, kamu berhasil fokus!</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-5 rounded-2xl border border-border/60 bg-muted/20 p-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600">
            <Flame className="h-3.5 w-3.5" />
            {session.planned_minutes} Menit Fokus Penuh
          </div>
          {session.task && (
            <p className="mt-3 truncate text-sm font-bold text-foreground">
              {session.task.title}
            </p>
          )}
        </div>

        {session.task && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 p-3.5 transition-colors hover:bg-muted/30">
            <input
              type="checkbox"
              checked={completeTask}
              onChange={(e) => setCompleteTask(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
            />
            <div className="text-xs">
              <span className="font-bold text-foreground">
                Tandai tugas ini sebagai selesai
              </span>
              <p className="mt-0.5 text-muted-foreground">
                Centang otomatis tugas "{session.task.title}" di dashboard.
              </p>
            </div>
          </label>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isCompleting}
            onClick={() => onConfirmComplete(completeTask)}
            className="w-full rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
          >
            <span className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              {isCompleting ? "Menyimpan…" : "Selesaikan & Simpan Sesi"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
