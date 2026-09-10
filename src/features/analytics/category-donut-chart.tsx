"use client";

/**
 * src/features/analytics/category-donut-chart.tsx
 * Donut chart SVG murni — Distribusi Tugas per Kategori.
 */

import type { CategoryDistributionItem } from "./queries";

const CATEGORY_COLORS: Record<string, { fill: string; label: string }> = {
  Kerja:   { fill: "#6366f1", label: "bg-indigo-500" },
  Belajar: { fill: "#10b981", label: "bg-emerald-500" },
  Pribadi: { fill: "#a855f7", label: "bg-violet-500" },
  Lainnya: { fill: "#f59e0b", label: "bg-amber-500" },
};

const FALLBACK_COLOR = { fill: "#94a3b8", label: "bg-slate-400" };

interface CategoryDonutChartProps {
  data: CategoryDistributionItem[];
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">
        Belum ada tugas yang tercatat.
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);

  // Hitung SVG arc path untuk donut chart
  const SIZE = 100;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 44;
  const R_INNER = 28;

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function slicePath(startAngle: number, endAngle: number) {
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const p1 = polarToCartesian(CX, CY, R_OUTER, startAngle);
    const p2 = polarToCartesian(CX, CY, R_OUTER, endAngle);
    const p3 = polarToCartesian(CX, CY, R_INNER, endAngle);
    const p4 = polarToCartesian(CX, CY, R_INNER, startAngle);
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  }

  let currentAngle = 0;
  const slices = data.map((item) => {
    const startAngle = currentAngle;
    const sweep = (item.total / total) * 360;
    currentAngle += sweep;
    return { ...item, startAngle, endAngle: currentAngle };
  });

  const completionRate =
    total > 0
      ? Math.round((data.reduce((s, d) => s + d.completed, 0) / total) * 100)
      : 0;

  return (
    <div className="mt-3 flex items-center gap-4">
      {/* SVG Donut */}
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {slices.map((slice) => {
            const color = CATEGORY_COLORS[slice.category] ?? FALLBACK_COLOR;
            return (
              <path
                key={slice.category}
                d={slicePath(slice.startAngle, slice.endAngle)}
                fill={color.fill}
                className="transition-opacity hover:opacity-80"
              />
            );
          })}
        </svg>
        {/* Label tengah */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black leading-none">{completionRate}%</span>
          <span className="text-[9px] text-muted-foreground">selesai</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-col gap-1.5 text-xs">
        {slices.map((item) => {
          const color = CATEGORY_COLORS[item.category] ?? FALLBACK_COLOR;
          const pct = Math.round((item.total / total) * 100);
          return (
            <div key={item.category} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 rounded-sm ${color.label}`} />
              <span className="text-foreground font-semibold">{item.category}</span>
              <span className="text-muted-foreground">
                {item.total} tugas ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
