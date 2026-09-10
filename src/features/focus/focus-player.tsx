"use client";

/**
 * src/features/focus/focus-player.tsx
 * Persistent mini-player yang tampil mengambang di kanan bawah
 * saat ada sesi fokus aktif (running atau paused).
 */

import { useEffect, useState, useTransition } from "react";
import { Play, Pause, Check, X, Timer, Sparkles } from "lucide-react";
import type { FocusSession } from "@/types";
import { calculateSessionTiming, type SessionTiming } from "@/lib/focus/timer-utils";
import { pauseFocusSession, resumeFocusSession, cancelFocusSession } from "./focus-actions";

interface FocusPlayerProps {
  session: FocusSession;
  onSessionFinish: () => void;
}

export function FocusPlayer({ session, onSessionFinish }: FocusPlayerProps) {
  const [timing, setTiming] = useState<SessionTiming>(() => calculateSessionTiming(session));
  const [isPending, startTransition] = useTransition();

  // Tick setiap 1 detik saat running
  useEffect(() => {
    // Hitung pertama kali
    setTiming(calculateSessionTiming(session));

    if (session.status !== "running") return;

    const interval = setInterval(() => {
      const nextTiming = calculateSessionTiming(session);
      setTiming(nextTiming);

      if (nextTiming.isFinished) {
        clearInterval(interval);
        onSessionFinish();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, onSessionFinish]);

  function handleTogglePause() {
    startTransition(async () => {
      if (session.status === "running") {
        await pauseFocusSession(session.id);
      } else {
        await resumeFocusSession(session.id);
      }
    });
  }

  function handleCancel() {
    if (!confirm("Apakah Anda yakin ingin membatalkan sesi fokus ini? Sesi yang dibatalkan tidak akan dihitung.")) {
      return;
    }
    startTransition(async () => {
      await cancelFocusSession(session.id);
    });
  }

  return (
    <aside
      aria-label="Sesi Fokus Aktif"
      className="fixed bottom-4 inset-x-3 z-40 animate-in slide-in-from-bottom-5 duration-300 sm:bottom-5 sm:inset-x-auto sm:right-5"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 sm:gap-3.5 sm:px-4 sm:py-3.5">
        {/* Progress Ring Mini */}
        <div className="relative flex h-11 w-11 items-center justify-center shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted/40"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary transition-all duration-1000 ease-linear"
              strokeDasharray={`${timing.progressPercent}, 100`}
              strokeLinecap="round"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Timer className={`h-4 w-4 ${session.status === "running" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          </div>
        </div>

        {/* Info Task & Remaining Time */}
        <div className="min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tabular-nums tracking-tight text-foreground sm:text-lg">
              {timing.formattedRemaining}
            </span>
            {session.status === "paused" && (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                Dijeda
              </span>
            )}
          </div>
          <p className="max-w-[150px] truncate text-[11px] font-semibold text-muted-foreground sm:max-w-[200px]">
            {session.task ? session.task.title : "Sesi Fokus Mandiri"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 border-l border-border/50 pl-2">
          {/* Pause / Resume */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleTogglePause}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary/20 hover:scale-105 disabled:opacity-50"
            title={session.status === "running" ? "Jeda sesi" : "Lanjutkan sesi"}
          >
            {session.status === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </button>

          {/* Selesai / Complete Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={onSessionFinish}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition hover:bg-emerald-500/20 hover:scale-105 disabled:opacity-50"
            title="Selesaikan sesi sekarang"
          >
            <Check className="h-4 w-4" />
          </button>

          {/* Cancel */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleCancel}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-destructive"
            title="Batalkan sesi fokus"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
