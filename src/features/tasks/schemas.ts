import { z } from "zod";

/**
 * Zod schema untuk form pembuatan tugas.
 * Sesuai PRD §6.2: Judul (wajib), Deskripsi (opsional), Kategori (wajib), Estimasi waktu (wajib, default 30).
 */
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Judul tugas wajib diisi")
    .max(100, "Judul maksimal 100 karakter"),

  description: z
    .string()
    .max(500, "Deskripsi terlalu panjang")
    .optional(),

  category: z.enum(
    ["Kerja", "Belajar", "Pribadi", "Lainnya"],
    { required_error: "Kategori wajib dipilih" }
  ),

  estimated_minutes: z.coerce
    .number()
    .int("Estimasi harus berupa angka bulat")
    .min(1, "Minimal 1 menit")
    .max(1440, "Maksimal 24 jam")
    .default(30),

  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional()
    .nullable(),

  start_time: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Format jam harus HH:mm"
    )
    .optional()
    .nullable(),

  priority: z
    .enum(["urgent", "high", "medium", "low"], {
      required_error: "Prioritas wajib dipilih",
    })
    .default("medium"),

  client_request_id: z
    .string()
    .uuid("Invalid client request ID"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// ---------------------------------------------------------------------------
// updateTaskSchema — all fields optional, for partial edits
// ---------------------------------------------------------------------------

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .min(1, "Judul tugas wajib diisi")
      .max(100, "Judul maksimal 100 karakter")
      .optional(),

    description: z
      .string()
      .max(500, "Deskripsi terlalu panjang")
      .optional()
      .nullable(),

    category: z
      .enum(["Kerja", "Belajar", "Pribadi", "Lainnya"])
      .optional(),

    priority: z
      .enum(["urgent", "high", "medium", "low"])
      .optional(),

    estimated_minutes: z.coerce
      .number()
      .int("Estimasi harus berupa angka bulat")
      .min(1, "Minimal 1 menit")
      .max(1440, "Maksimal 24 jam")
      .optional(),

    scheduled_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
      .optional()
      .nullable(),

    start_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm")
      .optional()
      .nullable(),

    deadline_at: z
      .string()
      .datetime({ offset: true, message: "Format deadline harus ISO 8601" })
      .optional()
      .nullable(),
  })
  .strict();

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// ---------------------------------------------------------------------------
// rescheduleTaskSchema — untuk drag-and-drop / jadwal ulang dari calendar view
// ---------------------------------------------------------------------------

export const rescheduleTaskSchema = z.object({
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .nullable(),

  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm")
    .nullable(),

  estimatedMinutes: z.coerce
    .number()
    .int("Estimasi harus berupa angka bulat")
    .min(15, "Minimal 15 menit")
    .max(1440, "Maksimal 24 jam"),
});

export type RescheduleTaskInput = z.infer<typeof rescheduleTaskSchema>;
