import { describe, it, expect } from "vitest";
import { getDeadlineStatus } from "@/lib/date-time";
import { sortTasksByPriority } from "@/lib/tasks/sorting";
import type { Task } from "@/types";

describe("getDeadlineStatus", () => {
  it("returns 'completed' when task is completed regardless of deadline", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(getDeadlineStatus(yesterday, true)).toBe("completed");
  });

  it("returns 'none' when deadline is null or empty", () => {
    expect(getDeadlineStatus(null, false)).toBe("none");
  });

  it("returns 'overdue' when deadline has passed", () => {
    const pastDate = new Date(Date.now() - 3600000 * 24 * 3).toISOString();
    expect(getDeadlineStatus(pastDate, false)).toBe("overdue");
  });

  it("returns 'upcoming' when deadline is well in the future", () => {
    const futureDate = new Date(Date.now() + 3600000 * 24 * 7).toISOString();
    expect(getDeadlineStatus(futureDate, false)).toBe("upcoming");
  });
});

describe("sortTasksByPriority", () => {
  function makeTask(overrides: Partial<Task>): Task {
    return {
      id: crypto.randomUUID(),
      user_id: "user-1",
      client_request_id: crypto.randomUUID(),
      title: "Test Task",
      description: null,
      category: "Kerja",
      priority: "medium",
      estimated_minutes: 30,
      scheduled_date: null,
      start_time: null,
      deadline_at: null,
      series_id: null,
      occurrence_date: null,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  it("places overdue task before future urgent task", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const future = new Date(Date.now() + 86400000).toISOString();

    const normalOverdue = makeTask({ priority: "low", deadline_at: past });
    const futureUrgent = makeTask({ priority: "urgent", deadline_at: future });

    const sorted = sortTasksByPriority([futureUrgent, normalOverdue]);
    expect(sorted[0].id).toBe(normalOverdue.id);
  });

  it("sorts by priority: urgent -> high -> medium -> low", () => {
    const urgent = makeTask({ priority: "urgent" });
    const high = makeTask({ priority: "high" });
    const medium = makeTask({ priority: "medium" });
    const low = makeTask({ priority: "low" });

    const sorted = sortTasksByPriority([low, medium, urgent, high]);
    expect(sorted.map((t) => t.priority)).toEqual([
      "urgent",
      "high",
      "medium",
      "low",
    ]);
  });
});
