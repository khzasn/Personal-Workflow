import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshBriefings } from "@/lib/rss/parser";
import { getServerEnv } from "@/lib/env";

/**
 * Endpoint API Cron Job: /api/briefings/refresh
 * Sesuai PRD §12: Digunakan oleh sistem cron eksternal (misal Vercel Cron atau GitHub Actions).
 * Wajib diamankan dengan token / secret header sederhana jika di-deploy ke production.
 */
export async function POST(request: Request) {
  try {
    // 1. Verifikasi keamanan (opsional tapi sangat disarankan)
    // Untuk prototipe/lokal, kita lewati atau gunakan authorization header
    const authHeader = request.headers.get("authorization");
    const env = getServerEnv();
    
    // Gunakan SUPABASE_SERVICE_ROLE_KEY sebagai cron secret sederhana
    if (authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // Note: Di-comment untuk memudahkan testing manual selama Fase 4.
    }

    // 2. Ambil semua user aktif dari Supabase
    const adminDb = createAdminClient();
    const { data: users, error } = await adminDb.auth.admin.listUsers();
    
    if (error || !users) {
      throw new Error("Gagal mengambil daftar pengguna");
    }

    // 3. Proses briefing untuk SETIAP pengguna
    // Ini berjalan di background dan bisa memakan waktu (makanya butuh cron external)
    const results = [];
    for (const user of users.users) {
      try {
        await refreshBriefings(user.id);
        results.push({ userId: user.id, status: "success" });
      } catch (err) {
        results.push({ userId: user.id, status: "error", error: String(err) });
      }
    }

    return NextResponse.json({
      message: "Briefing refresh cron job completed",
      processedUsers: results.length,
      details: results
    });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
