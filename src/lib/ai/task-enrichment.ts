/**
 * src/lib/ai/task-enrichment.ts
 * Integrasi Gemini AI untuk parsing bahasa alami ke struktur tugas kalender.
 * Berjalan eksklusif di Server.
 */

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getGeminiClient } from "./client";
import { buildNaturalLanguageTaskPrompt } from "./prompts";
import { getServerEnv } from "@/lib/env";
import {
  parsedNaturalTaskSchema,
  type ParsedNaturalTask,
} from "@/features/tasks/nl-input-schema";

/**
 * Parsing teks bebas pengguna menjadi struktur data tugas yang valid.
 */
export async function parseNaturalLanguageTask(
  inputText: string
): Promise<ParsedNaturalTask> {
  const now = new Date();
  const referenceDateStr = format(now, "yyyy-MM-dd");
  const dayOfWeekStr = format(now, "EEEE", { locale: idLocale });

  // Default fallback jika AI error / timeout
  const localFallback: ParsedNaturalTask = {
    title: inputText.trim().slice(0, 100),
    description: null,
    scheduled_date: referenceDateStr,
    start_time: null,
    estimated_minutes: 30,
    category: "Kerja",
    priority: "medium",
    recurrence_frequency: "none",
    confidence: 0.3,
    ambiguity_note: "Gagal menghubungkan ke AI. Dibuat dengan nilai bawaan.",
  };

  try {
    const env = getServerEnv();
    const ai = getGeminiClient();

    const systemPrompt = buildNaturalLanguageTaskPrompt(
      referenceDateStr,
      dayOfWeekStr,
      env.APP_TIMEZONE
    );

    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: `Input Pengguna: "${inputText}"` }],
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1, // Rendah untuk kepastian format
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      return localFallback;
    }

    const rawJson = JSON.parse(response.text);

    // Validasi & sanitasi dengan Zod
    const parsed = parsedNaturalTaskSchema.safeParse(rawJson);
    if (parsed.success) {
      return parsed.data;
    }

    console.warn("Validasi Zod parser NL gagal, menggunakan raw sanitasi:", parsed.error);
    return {
      ...localFallback,
      title: rawJson.title || localFallback.title,
      category: rawJson.category || "Kerja",
      priority: rawJson.priority || "medium",
      scheduled_date: rawJson.scheduled_date || referenceDateStr,
      start_time: rawJson.start_time || null,
      estimated_minutes: Number(rawJson.estimated_minutes) || 30,
      recurrence_frequency: rawJson.recurrence_frequency || "none",
      confidence: 0.5,
    };
  } catch (error) {
    console.error("AI Natural Language Parsing failed:", error);
    return localFallback;
  }
}
