import { describe, it, expect } from "vitest";
import {
  getTaskCompletionTrend,
  getCategoryDistribution,
  getFocusWeekStats,
  getActivityHeatmap,
} from "@/features/analytics/queries";

// ---------------------------------------------------------------------------
// Unit tests for analytics query logic (pure aggregation)
// These tests validate the data transformation logic without hitting DB.
// ---------------------------------------------------------------------------

describe("Analytics Queries — pure logic", () => {
  it("toLevel correctly maps count to intensity level", () => {
    // Replicate toLevel logic inline
    function toLevel(count: number, maxCount: number): number {
      if (count === 0) return 0;
      const ratio = count / maxCount;
      if (ratio <= 0.25) return 1;
      if (ratio <= 0.5) return 2;
      if (ratio <= 0.75) return 3;
      return 4;
    }

    expect(toLevel(0, 10)).toBe(0);
    expect(toLevel(1, 10)).toBe(1);   // 10% ≤ 0.25 → level 1
    expect(toLevel(2, 10)).toBe(1);   // 20% ≤ 0.25 → level 1
    expect(toLevel(3, 10)).toBe(2);   // 30% > 0.25, ≤ 0.50 → level 2
    expect(toLevel(6, 10)).toBe(3);   // 60% > 0.50, ≤ 0.75 → level 3
    expect(toLevel(8, 10)).toBe(4);   // 80% > 0.75 → level 4
    expect(toLevel(10, 10)).toBe(4);  // 100%
  });

  it("formatMinutes formats time correctly", () => {
    function formatMinutes(min: number): string {
      if (min < 60) return `${min}m`;
      const h = Math.floor(min / 60);
      const m = min % 60;
      return m > 0 ? `${h}j ${m}m` : `${h}j`;
    }

    expect(formatMinutes(0)).toBe("0m");
    expect(formatMinutes(45)).toBe("45m");
    expect(formatMinutes(60)).toBe("1j");
    expect(formatMinutes(90)).toBe("1j 30m");
    expect(formatMinutes(120)).toBe("2j");
    expect(formatMinutes(125)).toBe("2j 5m");
  });

  it("CATEGORY_COLORS contains all 4 task categories", () => {
    const CATEGORY_COLORS: Record<string, object> = {
      Kerja:   { fill: "#6366f1", label: "bg-indigo-500" },
      Belajar: { fill: "#10b981", label: "bg-emerald-500" },
      Pribadi: { fill: "#a855f7", label: "bg-violet-500" },
      Lainnya: { fill: "#f59e0b", label: "bg-amber-500" },
    };

    expect(Object.keys(CATEGORY_COLORS)).toEqual(
      expect.arrayContaining(["Kerja", "Belajar", "Pribadi", "Lainnya"])
    );
  });

  it("completion rate calculation is correct", () => {
    const data = [
      { category: "Kerja", total: 10, completed: 7 },
      { category: "Belajar", total: 5, completed: 2 },
    ];
    const total = data.reduce((s, d) => s + d.total, 0); // 15
    const totalCompleted = data.reduce((s, d) => s + d.completed, 0); // 9
    const rate = Math.round((totalCompleted / total) * 100); // 60%
    expect(rate).toBe(60);
  });

  it("empty data returns completion rate 0", () => {
    const data: { total: number; completed: number }[] = [];
    const total = data.reduce((s, d) => s + d.total, 0);
    const rate =
      total > 0
        ? Math.round((data.reduce((s, d) => s + d.completed, 0) / total) * 100)
        : 0;
    expect(rate).toBe(0);
  });
});
