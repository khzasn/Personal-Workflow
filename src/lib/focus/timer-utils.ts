/**
 * src/lib/focus/timer-utils.ts
 * Utility murni untuk menghitung waktu sesi fokus berdasarkan timestamp database.
 * Tahan refresh browser, sleep komputer, perpindahan tab, dan throttling timer background.
 */

import type { FocusSession } from "@/types";

export interface SessionTiming {
  elapsedSeconds: number;
  remainingSeconds: number;
  totalPlannedSeconds: number;
  progressPercent: number;
  formattedRemaining: string;
  isFinished: boolean;
}

/**
 * Menghitung status waktu sesi fokus saat ini
 */
export function calculateSessionTiming(
  session: FocusSession,
  currentTimestamp: number = Date.now()
): SessionTiming {
  const totalPlannedSeconds = Math.max(1, session.planned_minutes * 60);
  const startTime = new Date(session.started_at).getTime();
  const pausedSeconds = session.paused_seconds || 0;

  let elapsedSeconds = 0;

  if (session.status === "paused") {
    // Jika sedang paused, hitung sampai waktu paused_at
    const pauseTime = session.paused_at ? new Date(session.paused_at).getTime() : currentTimestamp;
    const rawElapsed = Math.floor((pauseTime - startTime) / 1000);
    elapsedSeconds = Math.max(0, rawElapsed - pausedSeconds);
  } else if (session.status === "running") {
    // Jika sedang running, hitung selisih waktu dari started_at dikurangi total paused_seconds
    const rawElapsed = Math.floor((currentTimestamp - startTime) / 1000);
    elapsedSeconds = Math.max(0, rawElapsed - pausedSeconds);
  } else {
    // Completed / Cancelled: hitung sampai ended_at
    const endTime = session.ended_at ? new Date(session.ended_at).getTime() : currentTimestamp;
    const rawElapsed = Math.floor((endTime - startTime) / 1000);
    elapsedSeconds = Math.max(0, rawElapsed - pausedSeconds);
  }

  const remainingSeconds = Math.max(0, totalPlannedSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / totalPlannedSeconds) * 100));

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedRemaining = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    elapsedSeconds,
    remainingSeconds,
    totalPlannedSeconds,
    progressPercent,
    formattedRemaining,
    isFinished: remainingSeconds === 0,
  };
}
