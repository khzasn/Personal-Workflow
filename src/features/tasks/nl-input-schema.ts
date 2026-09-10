/**
 * src/features/tasks/nl-input-schema.ts
 * Zod validation schema untuk hasil parsing tugas berbahasa alami (Natural-Language Task Input).
 */

import { z } from "zod";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/types";

export const parsedNaturalTaskSchema = z.object({
  title: z.string().min(1, "Judul tugas tidak boleh kosong").max(100),
  description: z.string().max(500).nullable().optional(),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .nullable()
    .optional(),
  start_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm")
    .nullable()
    .optional(),
  estimated_minutes: z.coerce.number().int().min(1).max(1440).default(30),
  category: z.enum(["Kerja", "Belajar", "Pribadi", "Lainnya"]).default("Kerja"),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  recurrence_frequency: z
    .enum(["none", "daily", "weekday", "weekly", "monthly"])
    .default("none"),
  confidence: z.number().min(0).max(1).default(0.9),
  ambiguity_note: z.string().nullable().optional(),
});

export type ParsedNaturalTask = z.infer<typeof parsedNaturalTaskSchema>;
