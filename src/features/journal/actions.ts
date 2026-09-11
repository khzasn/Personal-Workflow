"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood: "happy" | "neutral" | "sad" | "excited" | "tired";
  created_at: string;
  updated_at: string;
}

export type CreateJournalInput = {
  content: string;
  mood: JournalEntry["mood"];
};

/**
 * Ambil semua entri jurnal milik user yang sedang login.
 * Diurutkan dari terbaru ke terlama.
 */
export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // Jika tabel belum ada, kembalikan array kosong
    console.warn("[journal] getJournalEntries error:", error.message);
    return [];
  }
  return (data || []) as JournalEntry[];
}

/**
 * Simpan entri jurnal baru ke Supabase.
 */
export async function createJournalEntry(
  input: CreateJournalInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.content.trim()) {
    return { success: false, error: "Konten jurnal tidak boleh kosong." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  const { error } = await supabase.from("journal_entries").insert({
    user_id: user.id,
    content: input.content.trim(),
    mood: input.mood,
  });

  if (error) {
    console.error("[journal] createJournalEntry error:", error.message);
    return {
      success: false,
      error:
        error.code === "42P01"
          ? "Tabel jurnal belum tersedia. Silakan buat tabel journal_entries di Supabase terlebih dahulu."
          : error.message,
    };
  }

  revalidatePath("/jurnal");
  return { success: true };
}

/**
 * Hapus entri jurnal berdasarkan ID.
 */
export async function deleteJournalEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/jurnal");
  return { success: true };
}

import { getServerEnv } from "@/lib/env";
import { GoogleGenAI } from "@google/genai";

export async function polishJournalWithAI(content: string): Promise<{ success: boolean; polished?: string; error?: string }> {
  if (!content || !content.trim()) return { success: false, error: "Konten kosong" };

  try {
    const env = getServerEnv();
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    
    const prompt = `Anda adalah asisten penulis jurnal pribadi.
Tugas Anda: rapikan tulisan jurnal berikut. Perbaiki ejaan, tanda baca, dan alur kalimat agar lebih enak dibaca.
ATURAN MUTLAK:
1. PERTAHANKAN gaya bahasa dan suara asli penulis (casual, santai, dll).
2. JANGAN mengubah makna, cerita, atau fakta di dalamnya.
3. JANGAN menambahkan informasi baru yang tidak ada di teks asli.
4. JANGAN membalas dengan kata pengantar, langsung berikan hasil perbaikannya saja.

Teks asli:
"""
${content}
"""`;

    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    });

    if (!response.text) return { success: false, error: "Gagal memoles tulisan." };

    return { success: true, polished: response.text.trim() };
  } catch (error) {
    console.error("Gagal memoles jurnal:", error);
    return { success: false, error: "Gagal terhubung ke layanan AI." };
  }
}