import Parser from "rss-parser";
import { getServerEnv } from "@/lib/env";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/admin";

// Parser diinisialisasi tanpa timeout di level modul.
// Timeout diambil saat runtime di dalam fungsi refreshBriefings().
const parser = new Parser();

/**
 * Meringkas teks artikel menjadi tepat 3 poin JSON array.
 * Menggunakan Gemini AI, sesuai PRD §6.3.
 */
async function summarizeArticle(title: string, content: string): Promise<string[]> {
  const env = getServerEnv();
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const fallbackSummary = ["Tidak ada ringkasan", "-", "-"];

  const prompt = `Anda adalah asisten pembaca berita cepat.
Tugas Anda: buat ringkasan singkat dari artikel berikut.
ATURAN MUTLAK:
1. Ringkasan HARUS TERDIRI DARI TEPAT 3 POIN UTAMA.
2. Setiap poin maksimal 2 kalimat.
3. Anda HANYA boleh membalas dengan JSON array murni tanpa markdown/penjelasan.
Format: ["poin 1", "poin 2", "poin 3"]

Judul: ${title}
Konten: ${content.substring(0, 3000)}`; // Batasi konten agar tidak melebihi konteks

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.2, responseMimeType: "application/json" },
    });

    if (!response.text) return fallbackSummary;
    
    const parsed = JSON.parse(response.text);
    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed.map(String);
    }
    return fallbackSummary;
  } catch (error) {
    console.error("Gagal meringkas artikel:", error);
    return fallbackSummary;
  }
}

/**
 * Fetch RSS, ringkas dengan AI, dan simpan ke Supabase.
 * Berjalan eksklusif di server menggunakan Admin Client (bypass RLS).
 */
export async function refreshBriefings(userId: string) {
  const env = getServerEnv();
  const adminDb = createAdminClient();

  // 1. Bersihkan briefing lama milik user ini (sesuai aturan sinkronisasi)
  await adminDb.from("briefings").delete().eq("user_id", userId);

  const feeds = env.RSS_FEED_URLS;
  if (!feeds || feeds.length === 0) return;

  const maxArticles = env.RSS_MAX_ARTICLES_PER_FEED;
  const newBriefings = [];

  // 2. Fetch setiap feed
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      const sourceName = feed.title || "Sumber Berita";
      const articles = feed.items.slice(0, maxArticles);

      // 3. Proses artikel satu per satu (bisa di-parallel jika perlu, tapi sequential lebih aman untuk limit AI)
      for (const item of articles) {
        if (!item.title || !item.link) continue;
        
        const contentStr = item.contentSnippet || item.content || item.summary || "";
        const summary = await summarizeArticle(item.title, contentStr);
        
        newBriefings.push({
          user_id: userId,
          source_name: sourceName,
          feed_url: url,
          article_title: item.title,
          article_url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          summary: summary, // Harus tepat 3 elemen JSON array sesuai constraint DB
        });
      }
    } catch (err) {
      console.error(`Gagal mengambil RSS dari ${url}:`, err);
    }
  }

  // 4. Simpan ke Database
  if (newBriefings.length > 0) {
    const { error } = await adminDb.from("briefings").insert(newBriefings);
    if (error) console.error("Gagal menyimpan briefings:", error);
  }
}
