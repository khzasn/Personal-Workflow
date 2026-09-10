"use server";

/**
 * src/features/tasks/recurrence/actions.ts
 * Server Actions untuk mengelola seri tugas berulang (Task Series)
 * dan mutasi occurrence (single, future, all).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTaskSeriesSchema, type CreateTaskSeriesInput } from "./schema";
import { generateOccurrenceDates } from "./generator";
import type { ActionResult, Task, TaskSeries } from "@/types";

/**
 * Buat Seri Tugas Berulang Baru dan generate instance untuk 60 hari ke depan
 */
export async function createTaskSeries(
  input: CreateTaskSeriesInput
): Promise<ActionResult<TaskSeries>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const parsed = createTaskSeriesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Aturan perulangan tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const {
    title,
    description,
    category,
    priority,
    recurrenceRule,
    startsOn,
    endsOn,
    startTime,
    estimatedMinutes,
  } = parsed.data;

  // 1. Simpan seri baru di task_series
  const { data: series, error: seriesError } = await supabase
    .from("task_series")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      category,
      priority,
      recurrence_rule: JSON.stringify(recurrenceRule),
      starts_on: startsOn,
      ends_on: endsOn || null,
      start_time: startTime || null,
      estimated_minutes: estimatedMinutes,
    })
    .select()
    .single();

  if (seriesError || !series) {
    console.error("Gagal membuat task_series:", seriesError);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: `Gagal membuat seri tugas berulang: ${seriesError?.message || "Kesalahan database"}`,
      },
    };
  }

  // 2. Generate tanggal occurrence untuk rolling window 60 hari
  const occurrenceDates = generateOccurrenceDates({
    rule: recurrenceRule,
    startsOn,
    endsOn,
    windowDays: 60,
  });

  // 3. Siapkan rows tugas untuk batch insert
  const taskRows = occurrenceDates.map((dateStr) => ({
    user_id: user.id,
    client_request_id: crypto.randomUUID(),
    title,
    description: description || null,
    category,
    priority,
    estimated_minutes: estimatedMinutes,
    scheduled_date: dateStr,
    start_time: startTime || null,
    series_id: series.id,
    occurrence_date: dateStr,
  }));

  if (taskRows.length > 0) {
    const { error: tasksError } = await supabase
      .from("tasks")
      .insert(taskRows);

    if (tasksError) {
      console.error("Gagal men-generate occurrence tugas:", tasksError);
      // Bersihkan task_series yang baru dibuat jika gagal membuat jadwal kejadian
      await supabase.from("task_series").delete().eq("id", series.id);
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: `Gagal membuat jadwal kejadian tugas: ${tasksError.message}`,
        },
      };
    }
  }

  revalidatePath("/dashboard");
  return { ok: true, data: series as TaskSeries };
}

/**
 * Hapus tugas yang merupakan bagian dari seri berulang dengan pilihan scope:
 * - "single": Hanya hapus kejadian ini
 * - "future": Hapus kejadian ini dan semua kejadian berikutnya
 * - "all": Hapus seluruh kejadian dalam seri ini
 */
export async function deleteRecurringTask(
  taskId: string,
  mode: "single" | "future" | "all"
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  // 1. Ambil data task untuk mengetahui series_id dan occurrence_date
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, series_id, occurrence_date, scheduled_date")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !task) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Tugas tidak ditemukan" } };
  }

  if (!task.series_id || mode === "single") {
    // Hanya hapus satu task ini
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus tugas" } };
    }
  } else if (mode === "future") {
    // Hapus kejadian ini dan yang akan datang (yang belum selesai)
    const effectiveDate = task.occurrence_date || task.scheduled_date;
    if (effectiveDate) {
      await supabase
        .from("tasks")
        .delete()
        .eq("series_id", task.series_id)
        .eq("user_id", user.id)
        .gte("scheduled_date", effectiveDate)
        .eq("is_completed", false);

      // Update ends_on pada task_series agar tidak di-generate lagi di masa depan
      await supabase
        .from("task_series")
        .update({ ends_on: effectiveDate })
        .eq("id", task.series_id)
        .eq("user_id", user.id);
    }
  } else if (mode === "all") {
    // Hapus seluruh instance yang belum selesai dan hapus seri induknya
    await supabase
      .from("tasks")
      .delete()
      .eq("series_id", task.series_id)
      .eq("user_id", user.id)
      .eq("is_completed", false);

    await supabase
      .from("task_series")
      .delete()
      .eq("id", task.series_id)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Edit tugas berulang dengan pilihan scope:
 * - "single": Lepas hubungan series_id sehingga menjadi tugas mandiri, lalu update
 * - "all": Update data pada seluruh occurrence dalam seri yang belum selesai
 */
export async function editRecurringTask(
  taskId: string,
  mode: "single" | "all",
  updates: {
    title?: string;
    description?: string | null;
    category?: string;
    priority?: string;
    estimated_minutes?: number;
    start_time?: string | null;
  }
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("id, series_id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !task) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Tugas tidak ditemukan" } };
  }

  if (!task.series_id || mode === "single") {
    // Jadikan tugas mandiri (series_id = null)
    await supabase
      .from("tasks")
      .update({
        ...updates,
        series_id: null,
        occurrence_date: null,
      })
      .eq("id", taskId)
      .eq("user_id", user.id);
  } else if (mode === "all") {
    // Update data di seluruh instance yang belum selesai
    await supabase
      .from("tasks")
      .update(updates)
      .eq("series_id", task.series_id)
      .eq("user_id", user.id)
      .eq("is_completed", false);

    // Update metadata di task_series induk
    await supabase
      .from("task_series")
      .update(updates)
      .eq("id", task.series_id)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
