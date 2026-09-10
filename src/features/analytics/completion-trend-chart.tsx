"use client";

/**
 * src/features/analytics/completion-trend-chart.tsx
 * Bar chart SVG murni — Tren Penyelesaian 7 Hari Terakhir.
 */

import type { DailyCompletionPoint } from "./queries";

interface CompletionTrendChartProps {
  data: DailyCompletionPoint[];
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">
        Belum ada data penyelesaian tugas.
      </div>
    );
  }

  const maxCompleted = Math.max(...data.map((d) => d.completed), 1);
  const CHART_H = 80;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex items-end gap-1.5" style={{ height: CHART_H }}>
        {data.map((point) => {
          const pct = point.completed / maxCompleted;
          const barH = Math.max(pct * CHART_H, point.completed > 0 ? 4 : 2);
          return (
            <div
              key={point.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: CHART_H }}
            >
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-1.5 hidden rounded-lg border bg-popover px-2 py-1 text-[10px] font-semibold text-popover-foreground shadow-md group-hover:block whitespace-nowrap z-10">
                {point.completed} selesai · {point.created} dibuat
              </div>
              {/* Bar selesai */}
              <div
                className="w-full rounded-t-md bg-primary transition-all duration-300 group-hover:bg-primary/80"
                style={{ height: barH }}
              />
              {/* Garis baseline background */}
              {point.created > 0 && (
                <div
                  className="absolute bottom-0 w-full rounded-t-sm bg-primary/15"
                  style={{
                    height: Math.max((point.created / maxCompleted) * CHART_H, 2),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Label Hari */}
      <div className="flex gap-1.5">
        {data.map((point) => (
          <div
            key={point.date}
            className="flex-1 text-center text-[10px] font-medium text-muted-foreground"
          >
            {point.label}
          </div>
        ))}
      </div>
      {/* Legenda */}
      <div className="flex items-center gap-3 pt-1">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-3 rounded-sm bg-primary" />
          Selesai
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-block h-2 w-3 rounded-sm bg-primary/20" />
          Dibuat
        </span>
      </div>
    </div>
  );
}
