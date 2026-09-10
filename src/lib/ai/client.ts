/**
 * src/lib/ai/client.ts
 * Inisialisasi Google Gemini AI client singleton untuk Server Components & Server Actions.
 * JANGAN diimpor dari Client Components.
 */

import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/lib/env";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const env = getServerEnv();
    aiInstance = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiInstance;
}
