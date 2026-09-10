import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/lib/env";

export interface AIAnalysisResult {
  category: "Kerja" | "Belajar" | "Pribadi" | "Lainnya";
  estimated_minutes: number;
}

const SYSTEM_PROMPT = `Anda adalah asisten produktivitas.
Tugas Anda menganalisis teks tugas pengguna dan menentukan Kategori dan Estimasi Waktu.
ATURAN MUTLAK:
1. Kategori HANYA boleh salah satu dari: "Kerja", "Belajar", "Pribadi", atau "Lainnya".
2. Estimasi waktu harus berupa angka bulat dalam satuan menit (minimal 1, maksimal 1440).
3. Anda HANYA boleh membalas dengan JSON murni tanpa markdown, tanpa penjelasan apa pun.
Format JSON yang diharapkan:
{"category": "Kerja", "estimated_minutes": 60}`;

/**
 * Menganalisis judul dan deskripsi tugas menggunakan Gemini AI.
 * Berjalan secara eksklusif di Server.
 */
export async function analyzeTaskWithAI(
  title: string,
  description?: string,
): Promise<AIAnalysisResult> {
  // Fallback default sesuai aturan PRD §11 & Architecture §3.3
  const fallback: AIAnalysisResult = {
    category: "Lainnya",
    estimated_minutes: 30,
  };

  try {
    const env = getServerEnv();
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const textToAnalyze = `Judul: ${title}\nDeskripsi: ${description || "-"}`;

    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [
        { role: "user", parts: [{ text: textToAnalyze }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1, // Rendah agar konsisten
        responseMimeType: "application/json",
      },
    });

    if (!response.text) return fallback;

    // Parsing hasil JSON
    const parsed = JSON.parse(response.text);
    
    // Validasi kategori sesuai enum yang diizinkan
    const validCategories = ["Kerja", "Belajar", "Pribadi", "Lainnya"];
    const category = validCategories.includes(parsed.category) 
      ? parsed.category 
      : "Lainnya";
      
    // Validasi menit
    let minutes = Number(parsed.estimated_minutes);
    if (isNaN(minutes) || minutes < 1) minutes = 30;
    if (minutes > 1440) minutes = 1440;

    return {
      category: category as AIAnalysisResult["category"],
      estimated_minutes: minutes,
    };
  } catch (error) {
    console.error("AI Analysis failed, using fallback:", error);
    return fallback;
  }
}
