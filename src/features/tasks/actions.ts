"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema, rescheduleTaskSchema, updateTaskSchema } from "./schemas";
import type { ActionResult, Task } from "@/types";

/**
 * Server Action: Buat Tugas Baru — Architecture §4.6
 */
export async function createTask(
  formData: FormData,
  clientRequestId: string,
): Promise<ActionResult<Task>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    category: formData.get("category") as string,
    estimated_minutes: formData.get("estimated_minutes") as string,
    scheduled_date: (formData.get("scheduled_date") as string) || undefined,
    start_time: (formData.get("start_time") as string) || undefined,
    priority: (formData.get("priority") as string) || "medium",
    client_request_id: clientRequestId,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tugas tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

const { data: task, error } = await supabase
  .from("tasks")
  .insert({
    user_id: user.id,
    client_request_id: parsed.data.client_request_id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    estimated_minutes: parsed.data.estimated_minutes,
    scheduled_date: parsed.data.scheduled_date || null,
    start_time: parsed.data.start_time || null,
    priority: parsed.data.priority,
  })
  .select()
  .single();

  if (error) {
    // Tangani error idempotency (misal user klik submit 2x cepat)
    if (error.code === "23505") { // unique_violation
      return { ok: false, error: { code: "INTERNAL_ERROR", message: "Tugas ini sudah diproses." } };
    }
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan tugas" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: task as Task };
}

/**
 * Server Action: Update Status Tugas Selesai/Belum
 */
export async function updateTaskStatus(
  taskId: string,
  isCompleted: boolean,
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ 
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", user.id); // Guard tambahan memastikan milik sendiri

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengupdate tugas" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Server Action: Hapus Tugas
 */
export async function deleteTask(taskId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus tugas" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Server Action: Update detail tugas (judul, deskripsi, kategori, estimasi, dll.)
 * Seluruh field bersifat opsional — hanya field yang dikirim yang akan diubah.
 */
export async function updateTask(
  taskId: string,
  input: Record<string, unknown>,
): Promise<ActionResult<Task>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tugas tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", taskId)
    .eq("user_id", user.id) // RLS guard
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { ok: false, error: { code: "NOT_FOUND", message: "Tugas tidak ditemukan" } };
    }
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui tugas" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: task as Task };
}

/**
 * Server Action: Reschedule tugas — memperbarui tanggal, waktu, dan estimasi.
 * Dirancang untuk drag-and-drop dan editing jadwal dari calendar view.
 */
export async function rescheduleTask(
  taskId: string,
  input: {
    scheduledDate: string | null;
    startTime: string | null;
    estimatedMinutes: number;
  },
): Promise<ActionResult<Task>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const parsed = rescheduleTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data jadwal tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update({
      scheduled_date: parsed.data.scheduledDate,
      start_time: parsed.data.startTime,
      estimated_minutes: parsed.data.estimatedMinutes,
    })
    .eq("id", taskId)
    .eq("user_id", user.id) // RLS guard
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { ok: false, error: { code: "NOT_FOUND", message: "Tugas tidak ditemukan" } };
    }
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal menjadwal ulang tugas" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: task as Task };
}
