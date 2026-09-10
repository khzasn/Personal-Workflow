/**
 * src/features/tasks/recurrence/schema.ts
 * Zod validation schema untuk Recurring Tasks (Task Series).
 */

import { z } from "zod";

export const recurrenceFrequencySchema = z.enum([
  "none",
  "daily",
  "weekday",
  "weekly",
  "monthly",
  "custom",
]);

export const recurrenceRuleSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.coerce.number().int().min(1).max(365).default(1),
  // 1 = Monday, 7 = Sunday
  weekdays: z.array(z.coerce.number().int().min(1).max(7)).optional(),
  endsOn: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? null : val),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal berakhir harus YYYY-MM-DD")
        .optional()
        .nullable()
    ),
});

export const createTaskSeriesSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi").max(100),
  description: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? null : val),
      z.string().max(500).optional().nullable()
    ),
  category: z.enum(["Kerja", "Belajar", "Pribadi", "Lainnya"]).default("Kerja"),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  recurrenceRule: recurrenceRuleSchema,
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai harus YYYY-MM-DD"),
  endsOn: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? null : val),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal berakhir harus YYYY-MM-DD")
        .optional()
        .nullable()
    ),
  startTime: z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? null : val),
      z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm")
        .optional()
        .nullable()
    ),
  estimatedMinutes: z.coerce.number().int().min(15).max(1440).default(30),
});

export type CreateTaskSeriesInput = z.infer<typeof createTaskSeriesSchema>;
