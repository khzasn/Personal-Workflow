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
