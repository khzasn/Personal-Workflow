"use client";

/**
 * src/features/reminders/alarm-banner.tsx
 * In-app alarm banner yang mengambang di atas dashboard saat jam tugas tiba.
 * Terintegrasi langsung dengan Focus Timer untuk mulai fokus dalam 1 klik.
 */

import { Bell, Flame, Play, X, Clock } from "lucide-react";
import { useReminder } from "./reminder-context";
import { useFocus } from "@/features/focus/focus-context";

export function AlarmBanner() {
  const { activeAlarmTask, dismissAlarm } = useReminder();
  const { openFocusModal } = useFocus();

  if (!activeAlarmTask) return null;

  function handleStartFocus() {
    if (!activeAlarmTask) return;
    openFocusModal(activeAlarmTask);
    dismissAlarm();
  }

  const timeDisplay = activeAlarmTask.start_time
    ? activeAlarmTask.start_time.slice(0, 5)
    : "";

  return (
    <aside
      aria-label="Alarm Tugas Masuk"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg animate-in slide-in-from-top-6 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-white/95 p-4 shadow-2xl shadow-primary/20 backdrop-blur-xl dark:border-primary/30 dark:bg-slate-900/95">
        {/* Glowing top line indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="h-5 w-5 animate-bounce" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  <Bell className="h-3 w-3" />
                  Waktunya Tugas Dimulai
                </span>

                {timeDisplay && (
                  <span className="text-xs font-bold text-foreground">
                    {timeDisplay}
                  </span>
                )}
              </div>

              <h4 className="mt-1 truncate text-sm font-extrabold text-foreground sm:text-base">
                {activeAlarmTask.title}
              </h4>

              <p className="text-[11px] text-muted-foreground">
                Kategori: {activeAlarmTask.category} • Durasi estimasi:{" "}
                {activeAlarmTask.estimated_minutes} menit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissAlarm}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Tutup alarm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={dismissAlarm}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Nanti Saja
          </button>

          <button
            type="button"
            onClick={handleStartFocus}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-105 active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Mulai Sesi Fokus</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
