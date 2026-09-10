"use client";

/**
 * src/features/analytics/activity-heatmap.tsx
 * GitHub-style contribution heatmap — aktivitas tugas 12 minggu terakhir.
 */

import { useMemo } from "react";
import type { HeatmapDay } from "./queries";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

const LEVEL_COLORS = [
  "bg-muted/40",         // 0 — none
  "bg-primary/20",       // 1 — low
  "bg-primary/45",       // 2 — medium
  "bg-primary/70",       // 3 — high
  "bg-primary",          // 4 — max
];

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  // Kelompokkan data per minggu (kolom)
  const weeks = useMemo(() => {
    // Temukan hari pertama dalam data — mundur ke Minggu (dow=0) terdekat
    if (data.length === 0) return [];

    // Buat map date→HeatmapDay untuk akses O(1)
    const dayMap = new Map<string, HeatmapDay>();
    for (const d of data) dayMap.set(d.date, d);

    const firstDate = parseISO(data[0].date);
    const lastDate = parseISO(data[data.length - 1].date);

    // Mundur ke Minggu (getDay() === 0)
    const startSunday = new Date(firstDate);
    startSunday.setDate(startSunday.getDate() - startSunday.getDay());

    const weeksArr: (HeatmapDay | null)[][] = [];
    let current = new Date(startSunday);

    while (current <= lastDate) {
      const week: (HeatmapDay | null)[] = [];
      for (let dow = 0; dow < 7; dow++) {
        const dateStr = format(current, "yyyy-MM-dd");
        if (current > lastDate || current < firstDate) {
          week.push(null);
        } else {
          week.push(dayMap.get(dateStr) ?? { date: dateStr, count: 0, level: 0 });
        }
        current.setDate(current.getDate() + 1);
      }
      weeksArr.push(week);
    }
    return weeksArr;
  }, [data]);

  // Label bulan (tampilkan bulan di awal kolom minggu yang berganti bulan)
  const monthLabels = useMemo(() => {
    const labels: { weekIdx: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, idx) => {
      const firstReal = week.find((d) => d !== null);
      if (!firstReal) return;
      const month = parseISO(firstReal.date).getMonth();
      if (month !== lastMonth) {
        labels.push({
          weekIdx: idx,
          label: format(parseISO(firstReal.date), "MMM", { locale: id }),
        });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
        Belum ada data aktivitas.
      </div>
    );
  }

  const totalActive = data.filter((d) => d.count > 0).length;
  const totalTasks = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="mt-3 space-y-2">
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Label bulan */}
          <div
            className="mb-1 flex"
            style={{ paddingLeft: 28 }} // offset untuk label hari
          >
            {weeks.map((_, idx) => {
              const monthLabel = monthLabels.find((m) => m.weekIdx === idx);
              return (
                <div key={idx} className="w-[11px] shrink-0 text-[9px] text-muted-foreground/70 mr-[2px]">
                  {monthLabel?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Grid hari × minggu */}
          <div className="flex gap-0">
            {/* Label hari (kolom kiri) */}
            <div className="mr-1 flex flex-col gap-[2px] pt-0">
              {DAY_LABELS.map((day, i) => (
                <div
                  key={day}
                  className="flex h-[11px] items-center text-[9px] text-muted-foreground/60"
                >
                  {i % 2 === 1 ? day : ""}
                </div>
              ))}
            </div>

            {/* Kolom-kolom minggu */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="mr-[2px] flex flex-col gap-[2px]">
                {week.map((day, dIdx) => {
                  if (!day) {
                    return (
                      <div key={dIdx} className="h-[11px] w-[11px] rounded-sm bg-transparent" />
                    );
                  }
                  const formattedDate = format(parseISO(day.date), "d MMM yyyy", { locale: id });
                  return (
                    <div
                      key={dIdx}
                      title={`${formattedDate}: ${day.count} tugas`}
                      className={`h-[11px] w-[11px] rounded-sm transition-transform hover:scale-125 ${
                        LEVEL_COLORS[day.level]
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ringkasan & Legenda */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {totalTasks} tugas di {totalActive} hari aktif
        </span>
        <div className="flex items-center gap-1">
          <span>Sedikit</span>
          {LEVEL_COLORS.map((cls, i) => (
            <span key={i} className={`inline-block h-2.5 w-2.5 rounded-sm ${cls}`} />
          ))}
          <span>Banyak</span>
        </div>
      </div>
    </div>
  );
}
