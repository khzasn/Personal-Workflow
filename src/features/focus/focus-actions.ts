"use server";

/**
 * src/features/focus/focus-actions.ts
 * Server Actions untuk mengelola sesi fokus (Focus Sessions)
 * dengan garansi single active session dan kalkulasi durasi presisi.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, FocusSession, StartFocusInput } from "@/types";

/**
 * Mengambil sesi fokus yang sedang aktif (running atau paused) milik user saat ini
 */
export async function getActiveFocusSession(): Promise<ActionResult<FocusSession | null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const { data: session, error } = await supabase
    .from("focus_sessions")
    .select(`
      *,
      task:tasks (
        id,
        title,
        category,
        priority
      )
    `)
    .eq("user_id", user.id)
    .in("status", ["running", "paused"])
    .maybeSingle();

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil sesi aktif" } };
  }

  return { ok: true, data: (session as unknown as FocusSession) || null };
}

/**
 * Memulai sesi fokus baru. Jika ada sesi aktif sebelumnya, otomatis batalkan terlebih dahulu.
 */
export async function startFocusSession(
  input: StartFocusInput
): Promise<ActionResult<FocusSession>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const plannedMinutes = Math.max(1, Math.min(input.plannedMinutes || 25, 180));

  // 1. Batalkan sesi aktif sebelumnya jika ada (mencegah pelanggaran constraint unique single_active)
  await supabase
    .from("focus_sessions")
    .update({
      status: "cancelled",
      ended_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .in("status", ["running", "paused"]);

  // 2. Buat sesi baru
  const { data: session, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: user.id,
      task_id: input.taskId || null,
      started_at: new Date().toISOString(),
      planned_minutes: plannedMinutes,
      status: "running",
      paused_seconds: 0,
    })
    .select(`
      *,
      task:tasks (
        id,
        title,
        category,
        priority
      )
    `)
    .single();

  if (error || !session) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal memulai sesi fokus" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: session as unknown as FocusSession };
}

/**
 * Jeda sesi fokus (Pause)
 */
export async function pauseFocusSession(sessionId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const { error } = await supabase
    .from("focus_sessions")
    .update({
      status: "paused",
      paused_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "running");

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal menjeda sesi fokus" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Lanjutkan sesi fokus (Resume)
 */
export async function resumeFocusSession(sessionId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  // Ambil data sesi untuk menghitung durasi jeda
  const { data: session, error: fetchError } = await supabase
    .from("focus_sessions")
    .select("paused_at, paused_seconds")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .eq("status", "paused")
    .single();

  if (fetchError || !session || !session.paused_at) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Sesi tidak ditemukan atau tidak sedang dijeda" } };
  }

  const additionalPausedSeconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(session.paused_at).getTime()) / 1000)
  );

  const totalPausedSeconds = (session.paused_seconds || 0) + additionalPausedSeconds;

  const { error } = await supabase
    .from("focus_sessions")
    .update({
      status: "running",
      paused_at: null,
      paused_seconds: totalPausedSeconds,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal melanjutkan sesi fokus" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Tandai sesi fokus telah selesai (Completed)
 */
export async function completeFocusSession(
  sessionId: string,
  completeTask: boolean = false
): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  // 1. Ambil task_id jika ada
  const { data: session } = await supabase
    .from("focus_sessions")
    .select("task_id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  // 2. Selesaikan sesi
  const { error } = await supabase
    .from("focus_sessions")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      paused_at: null,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyelesaikan sesi fokus" } };
  }

  // 3. Jika pengguna memilih untuk menandai tugas terkait selesai
  if (completeTask && session?.task_id) {
    await supabase
      .from("tasks")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.task_id)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}

/**
 * Batalkan sesi fokus (Cancelled)
 */
export async function cancelFocusSession(sessionId: string): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  const { error } = await supabase
    .from("focus_sessions")
    .update({
      status: "cancelled",
      ended_at: new Date().toISOString(),
      paused_at: null,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal membatalkan sesi fokus" } };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: undefined };
}
