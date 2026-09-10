"use client";

/**
 * src/features/analytics/analytics-section.tsx
 * Container section Productivity Analytics — Phase 5.
 * Menerima pre-fetched data dari Server Component (dashboard/page.tsx).
 */

import { BarChart2, Layers, Timer, CalendarDays } from "lucide-react";
import { CompletionTrendChart } from "./completion-trend-chart";
import { CategoryDonutChart } from "./category-donut-chart";
import { FocusStatsCard } from "./focus-stats-card";
import { ActivityHeatmap } from "./activity-heatmap";
import type {
  DailyCompletionPoint,
  CategoryDistributionItem,
  FocusWeekStats,
  HeatmapDay,
} from "./queries";

interface AnalyticsSectionProps {
  completionTrend: DailyCompletionPoint[];
  categoryDistribution: CategoryDistributionItem[];
  focusWeekStats: FocusWeekStats;
  activityHeatmap: HeatmapDay[];
}

interface AnalyticsCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function AnalyticsCard({ icon, title, subtitle, children }: AnalyticsCardProps) {
  return (
    <div
      className="flex flex-col rounded-2xl border border-white/60 bg-white/70 p-4 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight text-foreground">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export function AnalyticsSection({
  completionTrend,
  categoryDistribution,
  focusWeekStats,
  activityHeatmap,
}: AnalyticsSectionProps) {
  return (
    <section className="animate-fade-up space-y-4">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
          <BarChart2 className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Analitik Produktivitas</h2>
          <p className="text-xs text-muted-foreground">Ringkasan aktivitas dan tren 7–12 minggu terakhir</p>
        </div>
      </div>

      {/* Grid 2×2 Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card 1: Completion Trend */}
        <AnalyticsCard
          icon={<BarChart2 className="h-4 w-4" />}
          title="Tren Penyelesaian"
          subtitle="7 hari terakhir"
        >
          <CompletionTrendChart data={completionTrend} />
        </AnalyticsCard>

        {/* Card 2: Category Distribution */}
        <AnalyticsCard
          icon={<Layers className="h-4 w-4" />}
          title="Distribusi Kategori"
          subtitle="Semua tugas yang pernah dibuat"
        >
          <CategoryDonutChart data={categoryDistribution} />
        </AnalyticsCard>

        {/* Card 3: Focus Stats */}
        <AnalyticsCard
          icon={<Timer className="h-4 w-4" />}
          title="Sesi Fokus"
          subtitle="7 hari terakhir"
        >
          <FocusStatsCard stats={focusWeekStats} />
        </AnalyticsCard>

        {/* Card 4: Activity Heatmap */}
        <AnalyticsCard
          icon={<CalendarDays className="h-4 w-4" />}
          title="Heatmap Aktivitas"
          subtitle="12 minggu terakhir"
        >
          <ActivityHeatmap data={activityHeatmap} />
        </AnalyticsCard>
      </div>
    </section>
  );
}
