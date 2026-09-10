import { describe, it, expect } from "vitest";
import { parsedNaturalTaskSchema } from "@/features/tasks/nl-input-schema";
import { buildNaturalLanguageTaskPrompt } from "@/lib/ai/prompts";

describe("Natural-Language Task Schema Validation", () => {
  it("validates a fully-specified parsed task correctly", () => {
    const raw = {
      title: "Meeting Tim Desain",
      description: "Membahas wireframe baru",
      scheduled_date: "2026-09-11",
      start_time: "14:00",
      estimated_minutes: 45,
      category: "Kerja",
      priority: "urgent",
      recurrence_frequency: "none",
      confidence: 0.95,
      ambiguity_note: null,
    };

    const parsed = parsedNaturalTaskSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Meeting Tim Desain");
      expect(parsed.data.category).toBe("Kerja");
      expect(parsed.data.priority).toBe("urgent");
      expect(parsed.data.estimated_minutes).toBe(45);
      expect(parsed.data.start_time).toBe("14:00");
    }
  });

  it("applies default values for category, priority, and duration when omitted", () => {
    const raw = {
      title: "Belajar Next.js",
      confidence: 0.8,
    };

    const parsed = parsedNaturalTaskSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.category).toBe("Kerja");
      expect(parsed.data.priority).toBe("medium");
      expect(parsed.data.estimated_minutes).toBe(30);
      expect(parsed.data.recurrence_frequency).toBe("none");
      expect(parsed.data.scheduled_date).toBeUndefined();
      expect(parsed.data.start_time).toBeUndefined();
    }
  });

  it("coerces string estimated_minutes to number", () => {
    const raw = {
      title: "Sprint Review",
      estimated_minutes: "60",
      confidence: 0.9,
    };

    const parsed = parsedNaturalTaskSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.estimated_minutes).toBe(60);
    }
  });

  it("detects valid recurrence_frequency", () => {
    const raw = {
      title: "Olahraga Pagi",
      scheduled_date: "2026-09-10",
      start_time: "06:00",
      recurrence_frequency: "daily",
      confidence: 0.9,
    };

    const parsed = parsedNaturalTaskSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.recurrence_frequency).toBe("daily");
    }
  });

  it("fails if title is empty", () => {
    const raw = {
      title: "",
      confidence: 0.5,
    };

    const parsed = parsedNaturalTaskSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });
});

describe("Natural-Language AI Prompt Generator", () => {
  it("includes reference date, day of week, and timezone in system prompt", () => {
    const prompt = buildNaturalLanguageTaskPrompt(
      "2026-09-10",
      "Kamis",
      "Asia/Bangkok"
    );

    expect(prompt).toContain("2026-09-10");
    expect(prompt).toContain("Kamis");
    expect(prompt).toContain("Asia/Bangkok");
    expect(prompt).toContain("title");
    expect(prompt).toContain("scheduled_date");
    expect(prompt).toContain("start_time");
    expect(prompt).toContain("estimated_minutes");
    expect(prompt).toContain("recurrence_frequency");
  });
});
