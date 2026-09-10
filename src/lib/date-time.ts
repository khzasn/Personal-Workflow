/**
 * src/lib/date-time.ts
 * Centralized date and time utilities for the Dayflow application.
 *
 * Timezone: Asia/Bangkok (UTC+7) — configurable via APP_TIMEZONE env.
 *
 * ⚠️ CRITICAL: Always use these helpers when parsing/formatting dates to avoid
 * UTC-shift bugs (e.g. "2026-09-09" becoming "2026-09-08" due to UTC midnight).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Application timezone. Matches APP_TIMEZONE env default. */
export const APP_TIMEZONE = "Asia/Bangkok";

// ---------------------------------------------------------------------------
// Time string utilities (HH:mm / HH:mm:ss)
// ---------------------------------------------------------------------------

/**
 * Convert a time string "HH:mm" or "HH:mm:ss" to total minutes since midnight.
 * Returns 0 for invalid input.
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const parts = time.slice(0, 5).split(":");
  const hours = parseInt(parts[0] ?? "0", 10);
  const minutes = parseInt(parts[1] ?? "0", 10);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Convert total minutes since midnight to a "HH:mm" time string.
 * Clamps to [0, 23:59].
 */
export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Format a "HH:mm" or "HH:mm:ss" start time with an optional duration
 * into a human-readable range like "09:00 – 10:30".
 */
export function formatTaskTime(startTime: string, durationMinutes?: number): string {
  const start = startTime.slice(0, 5);
  if (!durationMinutes) return start;
  const endMinutes = timeToMinutes(startTime) + durationMinutes;
  return `${start} – ${minutesToTime(endMinutes)}`;
}

// ---------------------------------------------------------------------------
// Date string utilities (YYYY-MM-DD)
// ---------------------------------------------------------------------------

/**
 * Returns today's date as a "YYYY-MM-DD" string in the app timezone.
 * Uses Intl.DateTimeFormat to avoid UTC midnight shift.
 */
export function todayLocalDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
  }).format(new Date());
}

/**
 * Compare two "YYYY-MM-DD" date strings for calendar-day equality.
 * Safe: compares the string values directly (no UTC conversion).
 */
export function isSameLocalDate(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  // Both are YYYY-MM-DD strings — direct equality is sufficient.
  return a.slice(0, 10) === b.slice(0, 10);
}

/**
 * Convert a JS Date to "YYYY-MM-DD" in the app timezone.
 * Use this instead of toISOString().slice(0, 10) which uses UTC.
 */
export function dateToLocalString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
  }).format(date);
}

/**
 * Parse a "YYYY-MM-DD" string to a JS Date at local midnight.
 * Using `T00:00` with no timezone suffix prevents UTC shift on most platforms.
 * Safe for display/comparison but NOT for sending to Supabase TIMESTAMPTZ directly.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T00:00:00`);
}

// ---------------------------------------------------------------------------
// Deadline status
// ---------------------------------------------------------------------------

export type DeadlineStatus =
  | "none"      // no deadline, or task is completed
  | "upcoming"  // > 48 h away
  | "today"     // same calendar day
  | "overdue"   // deadline is in the past
  | "completed";// task is already completed

/**
 * Compute the visual deadline status for a task.
 *
 * Rules:
 * - Completed tasks → "completed"
 * - No deadline → "none"
 * - Deadline has passed → "overdue"
 * - Deadline is today (same calendar day in APP_TIMEZONE) → "today"
 * - Otherwise → "upcoming"
 */
export function getDeadlineStatus(
  deadlineAt: string | null,
  isCompleted: boolean,
): DeadlineStatus {
  if (isCompleted) return "completed";
  if (!deadlineAt) return "none";

  const now = new Date();
  const deadline = new Date(deadlineAt);

  if (isNaN(deadline.getTime())) return "none";

  // Already overdue?
  if (deadline < now) return "overdue";

  // Same calendar day?
  const todayStr = todayLocalDate();
  const deadlineStr = dateToLocalString(deadline);
  if (todayStr === deadlineStr) return "today";

  return "upcoming";
}
