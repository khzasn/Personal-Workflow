"use client";

/**
 * src/features/analytics/focus-stats-card.tsx
 * Statistik ringkasan sesi fokus 7 hari terakhir dengan mini bar chart.
 */

import { Timer, Zap, TrendingUp } from "lucide-react";
import type { FocusWeekStats } from "./queries";

interface FocusStatsCardProps {
  stats: FocusWeekStats;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

export function FocusStatsCard({ stats }: FocusStatsCardProps) {
  const maxMin = Math.max(...stats.dailyPoints.map((d) => d.totalMinutes), 1);
  const BAR_H = 40;

  const isEmpty = stats.totalSessions === 0;

  return (
    <div className="mt-3 space-y-3">
      {/* Stat Baris */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center rounded-xl border bg-background/60 px-2 py-2">
          <Timer className="mb-1 h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-black">
            {formatMinutes(stats.totalMinutes)}
          </span>
          <span className="text-[10px] text-muted-foreground">Total fokus</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border bg-background/60 px-2 py-2">
          <Zap className="mb-1 h-3.5 w-3.5 text-amber-500" />
          <span className="text-sm font-black">{stats.totalSessions}</span>
          <span className="text-[10px] text-muted-foreground">Sesi</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border bg-background/60 px-2 py-2">
          <TrendingUp className="mb-1 h-3.5 w-3.5 text-emerald-500" />
          <span className="text-sm font-black">
            {formatMinutes(stats.avgMinutesPerSession)}
          </span>
          <span className="text-[10px] text-muted-foreground">Rata-rata</span>
        </div>
      </div>

      {/* Mini Bar Chart Harian */}
      {isEmpty ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Belum ada sesi fokus minggu ini.
        </p>
      ) : (
        <div className="space-y-1">
          <div className="flex items-end gap-1" style={{ height: BAR_H }}>
            {stats.dailyPoints.map((point) => {
              const pct = point.totalMinutes / maxMin;
              const barH = Math.max(pct * BAR_H, point.totalMinutes > 0 ? 4 : 2);
              return (
                <div
                  key={point.date}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: BAR_H }}
                >
                  {point.totalMinutes > 0 && (
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden rounded border bg-popover px-1.5 py-0.5 text-[10px] font-semibold shadow group-hover:block whitespace-nowrap z-10">
                      {formatMinutes(point.totalMinutes)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      point.totalMinutes > 0
                        ? "bg-violet-500 group-hover:bg-violet-400"
                        : "bg-muted/50"
                    }`}
                    style={{ height: barH }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1">
            {stats.dailyPoints.map((point) => (
              <div
                key={point.date}
                className="flex-1 text-center text-[10px] text-muted-foreground"
              >
                {point.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
