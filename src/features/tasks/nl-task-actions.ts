"use server";

/**
 * src/features/tasks/nl-task-actions.ts
 * Server Action untuk parsing tugas dari bahasa alami pengguna via Gemini AI.
 */

import { createClient } from "@/lib/supabase/server";
import { parseNaturalLanguageTask } from "@/lib/ai/task-enrichment";
import type { ActionResult } from "@/types";
import type { ParsedNaturalTask } from "./nl-input-schema";

export async function parseNaturalTaskAction(
  inputText: string
): Promise<ActionResult<ParsedNaturalTask>> {
  // 1. Verifikasi autentikasi pengguna
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Silakan login terlebih dahulu." },
    };
  }

  // 2. Validasi input
  const cleanInput = inputText.trim();
  if (!cleanInput) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Tuliskan tugas Anda terlebih dahulu.",
      },
    };
  }

  // 3. Proses dengan Gemini AI
  try {
    const parsed = await parseNaturalLanguageTask(cleanInput);
    return { ok: true, data: parsed };
  } catch (error) {
    console.error("Gagal memproses natural language task:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal menganalisis tugas dengan AI. Silakan coba lagi.",
      },
    };
  }
}
