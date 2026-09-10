import { describe, it, expect } from "vitest";
import { timeToMinutes, todayLocalDate } from "@/lib/date-time";
import type { Task } from "@/types";

describe("Task Reminder & Alarm Logic", () => {
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
      scheduled_date: "2026-09-10",
      start_time: "09:00:00",
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

  function isTaskDue(
    task: Task,
    todayStr: string,
    currentMinutes: number,
    notifiedIds: Set<string>
  ): boolean {
    if (task.is_completed) return false;
    if (task.scheduled_date !== todayStr) return false;
    if (!task.start_time) return false;
    if (notifiedIds.has(task.id)) return false;

    const taskStartMin = timeToMinutes(task.start_time);
    return currentMinutes >= taskStartMin && currentMinutes <= taskStartMin + 3;
  }

  const today = "2026-09-10";

  it("triggers reminder when current time matches task start time", () => {
    const task = makeTask({ start_time: "10:30:00" });
    const currentMin = 10 * 60 + 30; // 10:30
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(true);
  });

  it("triggers reminder within 3-minute grace period", () => {
    const task = makeTask({ start_time: "10:30:00" });
    const currentMin = 10 * 60 + 32; // 10:32 (2 mins late)
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(true);
  });

  it("does NOT trigger if task start time is in the future", () => {
    const task = makeTask({ start_time: "10:30:00" });
    const currentMin = 10 * 60 + 20; // 10:20 (10 mins early)
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(false);
  });

  it("does NOT trigger if task start time is already in the past beyond grace period", () => {
    const task = makeTask({ start_time: "10:30:00" });
    const currentMin = 10 * 60 + 40; // 10:40 (10 mins late)
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(false);
  });

  it("does NOT trigger if task is already completed", () => {
    const task = makeTask({ start_time: "10:30:00", is_completed: true });
    const currentMin = 10 * 60 + 30;
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(false);
  });

  it("does NOT trigger if scheduled for a different date", () => {
    const task = makeTask({ scheduled_date: "2026-09-15", start_time: "10:30:00" });
    const currentMin = 10 * 60 + 30;
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(false);
  });

  it("does NOT trigger if task has no start time", () => {
    const task = makeTask({ start_time: null });
    const currentMin = 10 * 60 + 30;
    const notified = new Set<string>();

    expect(isTaskDue(task, today, currentMin, notified)).toBe(false);
  });

  it("does NOT trigger repeatedly if already notified (idempotent)", () => {
    const task = makeTask({ start_time: "10:30:00" });
    const currentMin = 10 * 60 + 30;
    const notified = new Set<string>([task.id]);

    expect(isTaskDue(task, today, currentMin, notified)).toBe(false);
  });
});
