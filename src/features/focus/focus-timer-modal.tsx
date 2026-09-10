"use client";

/**
 * src/features/focus/focus-timer-modal.tsx
 * Modal untuk memilih durasi sesi fokus (25m, 50m, Custom)
 * sebelum memulai timer.
 */

import { useState } from "react";
import { Timer, Zap, Sparkles, X } from "lucide-react";
import type { Task } from "@/types";

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTask?: Task | null;
  onStart: (plannedMinutes: number, taskId?: string | null) => void;
  isStarting: boolean;
}

const PRESET_DURATIONS = [
  { minutes: 25, label: "Pomodoro", subtitle: "25 menit fokus penuh", icon: Timer },
  { minutes: 50, label: "Deep Work", subtitle: "50 menit kerja intens", icon: Zap },
];

export function FocusTimerModal({
  isOpen,
  onClose,
  targetTask,
  onStart,
  isStarting,
}: FocusTimerModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [isCustom, setIsCustom] = useState(false);
  const [customInput, setCustomInput] = useState<string>("30");

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalMinutes = isCustom
      ? Math.max(1, Math.min(parseInt(customInput, 10) || 25, 180))
      : selectedMinutes;

    onStart(finalMinutes, targetTask?.id || null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in-50">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 sm:p-7">
        <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Mulai Sesi Fokus</h3>
              <p className="text-xs text-muted-foreground">Pilih durasi fokusmu</p>
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

        {targetTask && (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Tugas Terkait
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-foreground">
              {targetTask.title}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {PRESET_DURATIONS.map(({ minutes, label, subtitle, icon: Icon }) => {
              const isActive = !isCustom && selectedMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedMinutes(minutes);
                  }}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                      : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <Icon className="h-4 w-4 mb-2 opacity-80" />
                  <span className="text-sm font-bold">{label}</span>
                  <span className="mt-0.5 text-[11px] opacity-75">{subtitle}</span>
                </button>
              );
            })}
          </div>

          <div
            onClick={() => setIsCustom(true)}
            className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
              isCustom
                ? "border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/20"
                : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 opacity-80" />
                <span className="text-xs font-bold">Kustom Menit</span>
              </div>
              {isCustom && (
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="w-16 rounded-lg border border-primary/40 bg-background px-2 py-1 text-center text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs font-semibold">menit</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isStarting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Timer className="h-3.5 w-3.5" />
              {isStarting ? "Memulai…" : "Mulai Fokus Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
