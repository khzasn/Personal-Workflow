/**
 * src/features/analytics/queries.ts
 * Server-side data fetching untuk Productivity Analytics (Phase 5).
 * Semua query read-only, scoped ke auth.uid() via RLS.
 */

import { createClient } from "@/lib/supabase/server";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyCompletionPoint {
  date: string;       // "YYYY-MM-DD"
  label: string;      // "Sen", "Sel", ...
  completed: number;
  created: number;
}

export interface CategoryDistributionItem {
  category: string;
  total: number;
  completed: number;
}

export interface DailyFocusPoint {
  date: string;       // "YYYY-MM-DD"
  label: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface FocusWeekStats {
  totalMinutes: number;
  totalSessions: number;
  avgMinutesPerSession: number;
  dailyPoints: DailyFocusPoint[];
}

export interface HeatmapDay {
  date: string;       // "YYYY-MM-DD"
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0=none, 4=most
}

// ---------------------------------------------------------------------------
// 1. Tren Penyelesaian 7 Hari Terakhir
// ---------------------------------------------------------------------------

export async function getTaskCompletionTrend(
  days = 7
): Promise<DailyCompletionPoint[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date();
  const from = startOfDay(subDays(today, days - 1));
  const fromStr = format(from, "yyyy-MM-dd");

  const { data: completedRaw } = await supabase
    .from("tasks")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .gte("completed_at", `${fromStr}T00:00:00.000Z`);

  const { data: createdRaw } = await supabase
    .from("tasks")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", `${fromStr}T00:00:00.000Z`);

  // Bangun map dari tanggal ke count
  const completedByDate = new Map<string, number>();
  const createdByDate = new Map<string, number>();

  for (const row of completedRaw ?? []) {
    if (!row.completed_at) continue;
    const d = row.completed_at.slice(0, 10);
    completedByDate.set(d, (completedByDate.get(d) ?? 0) + 1);
  }
  for (const row of createdRaw ?? []) {
    if (!row.created_at) continue;
    const d = row.created_at.slice(0, 10);
    createdByDate.set(d, (createdByDate.get(d) ?? 0) + 1);
  }

  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const interval = eachDayOfInterval({ start: from, end: today });

  return interval.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return {
      date: dateStr,
      label: dayLabels[day.getDay()],
      completed: completedByDate.get(dateStr) ?? 0,
      created: createdByDate.get(dateStr) ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// 2. Distribusi Kategori
// ---------------------------------------------------------------------------

export async function getCategoryDistribution(): Promise<CategoryDistributionItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tasks")
    .select("category, is_completed")
    .eq("user_id", user.id);

  if (!data || data.length === 0) return [];

  const map = new Map<string, { total: number; completed: number }>();
  for (const row of data) {
    const cat = row.category as string;
    const existing = map.get(cat) ?? { total: 0, completed: 0 };
    map.set(cat, {
      total: existing.total + 1,
      completed: existing.completed + (row.is_completed ? 1 : 0),
    });
  }

  return Array.from(map.entries())
    .map(([category, stats]) => ({ category, ...stats }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// 3. Statistik Sesi Fokus 7 Hari Terakhir
// ---------------------------------------------------------------------------

export async function getFocusWeekStats(days = 7): Promise<FocusWeekStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: FocusWeekStats = {
    totalMinutes: 0,
    totalSessions: 0,
    avgMinutesPerSession: 0,
    dailyPoints: [],
  };
  if (!user) return empty;

  const today = new Date();
  const from = startOfDay(subDays(today, days - 1));
  const fromStr = from.toISOString();

  const { data } = await supabase
    .from("focus_sessions")
    .select("started_at, ended_at, paused_seconds, planned_minutes, status")
    .eq("user_id", user.id)
    .in("status", ["completed", "cancelled"])
    .gte("started_at", fromStr);

  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const interval = eachDayOfInterval({ start: from, end: today });

  const minutesByDate = new Map<string, number>();
  const sessionsByDate = new Map<string, number>();

  let totalMinutes = 0;
  let totalSessions = 0;

  for (const row of data ?? []) {
    if (!row.started_at || !row.ended_at) continue;
    const startedMs = new Date(row.started_at).getTime();
    const endedMs = new Date(row.ended_at).getTime();
    const durationMin = Math.round(
      (endedMs - startedMs - (row.paused_seconds ?? 0) * 1000) / 60_000
    );
    if (durationMin <= 0) continue;

    const d = row.started_at.slice(0, 10);
    minutesByDate.set(d, (minutesByDate.get(d) ?? 0) + durationMin);
    sessionsByDate.set(d, (sessionsByDate.get(d) ?? 0) + 1);
    totalMinutes += durationMin;
    totalSessions += 1;
  }

  const dailyPoints: DailyFocusPoint[] = interval.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return {
      date: dateStr,
      label: dayLabels[day.getDay()],
      totalMinutes: minutesByDate.get(dateStr) ?? 0,
      sessionCount: sessionsByDate.get(dateStr) ?? 0,
    };
  });

  return {
    totalMinutes,
    totalSessions,
    avgMinutesPerSession:
      totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    dailyPoints,
  };
}

// ---------------------------------------------------------------------------
// 4. Activity Heatmap (12 minggu × 7 hari)
// ---------------------------------------------------------------------------

export async function getActivityHeatmap(weeks = 12): Promise<HeatmapDay[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date();
  const from = startOfDay(subDays(today, weeks * 7 - 1));
  const fromStr = format(from, "yyyy-MM-dd");

  const { data } = await supabase
    .from("tasks")
    .select("scheduled_date")
    .eq("user_id", user.id)
    .gte("scheduled_date", fromStr)
    .not("scheduled_date", "is", null);

  const countByDate = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.scheduled_date) continue;
    countByDate.set(
      row.scheduled_date,
      (countByDate.get(row.scheduled_date) ?? 0) + 1
    );
  }

  // Tentukan level intensitas berdasarkan quartile
  const counts = Array.from(countByDate.values()).filter((v) => v > 0);
  const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

  function toLevel(count: number): HeatmapDay["level"] {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  const interval = eachDayOfInterval({ start: from, end: today });
  return interval.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const count = countByDate.get(dateStr) ?? 0;
    return { date: dateStr, count, level: toLevel(count) };
  });
}
