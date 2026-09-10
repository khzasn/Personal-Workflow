"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refreshBriefings } from "@/lib/rss/parser";
import type { ActionResult } from "@/types";

/**
 * Server Action: Memicu proses penarikan ulang Briefing Harian
 */
export async function refreshBriefingAction(): Promise<ActionResult<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHORIZED", message: "Belum login" } };
  }

  try {
    // Jalankan refresh briefing sinkron (atau asinkron tergantung arsitektur,
    // di sini kita tunggu prosesnya agar UI tahu saat selesai)
    await refreshBriefings(user.id);
    
    // Perbarui UI
    revalidatePath("/dashboard");
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Failed to refresh briefings:", error);
    return { 
      ok: false, 
      error: { code: "INTERNAL_ERROR", message: "Gagal memuat ulang briefing" } 
    };
  }
}
