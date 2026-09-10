"use server";

import { analyzeTaskWithAI, type AIAnalysisResult } from "@/lib/ai/fallback";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types";

/**
 * Server Action: Menganalisis tugas pengguna dengan Gemini AI.
 * Sesuai Architecture §4.6.
 */
export async function analyzeTaskAction(
  title: string,
  description?: string,
): Promise<ActionResult<AIAnalysisResult>> {
  // Pastikan user login sebelum membolehkan pemakaian token AI (Security rule)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Sesi tidak valid" },
    };
  }

  if (!title || title.trim() === "") {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Judul tidak boleh kosong" },
    };
  }

  const result = await analyzeTaskWithAI(title, description);
  
  return { ok: true, data: result };
}
