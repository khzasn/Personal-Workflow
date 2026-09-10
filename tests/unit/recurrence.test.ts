import { describe, it, expect } from "vitest";
import { generateOccurrenceDates } from "@/features/tasks/recurrence/generator";
import { createTaskSeriesSchema } from "@/features/tasks/recurrence/schema";

describe("Recurrence Generator", () => {
  it("generates daily occurrences across rolling window", () => {
    const dates = generateOccurrenceDates({
      rule: { frequency: "daily", interval: 1 },
      startsOn: "2026-09-10",
      windowDays: 5,
    });

    expect(dates).toEqual([
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("respects endsOn constraint", () => {
    const dates = generateOccurrenceDates({
      rule: { frequency: "daily", interval: 1, endsOn: "2026-09-12" },
      startsOn: "2026-09-10",
      windowDays: 30,
    });

    expect(dates).toEqual(["2026-09-10", "2026-09-11", "2026-09-12"]);
  });

  it("generates weekday occurrences (excluding Saturday and Sunday)", () => {
    // 2026-09-11 is Friday, 2026-09-12 is Saturday, 2026-09-13 is Sunday, 2026-09-14 is Monday
    const dates = generateOccurrenceDates({
      rule: { frequency: "weekday" },
      startsOn: "2026-09-11",
      windowDays: 4,
    });

    expect(dates).toEqual(["2026-09-11", "2026-09-14", "2026-09-15"]);
  });
});

describe("Recurrence Schema Validation", () => {
  it("coerces empty string endsOn and startTime to null", () => {
    const result = createTaskSeriesSchema.safeParse({
      title: "Daily Standup",
      category: "Kerja",
      priority: "high",
      recurrenceRule: {
        frequency: "daily",
        interval: 1,
        endsOn: "",
      },
      startsOn: "2026-09-10",
      endsOn: "",
      startTime: "",
      estimatedMinutes: 30,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endsOn).toBeNull();
      expect(result.data.startTime).toBeNull();
      expect(result.data.recurrenceRule.endsOn).toBeNull();
    }
  });
});
