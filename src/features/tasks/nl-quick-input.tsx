"use client";

/**
 * src/features/tasks/nl-quick-input.tsx
 * Komponen Input Cepat Berbahasa Alami (Natural-Language Task Input) dengan Gemini AI.
 * Diletakkan di atas tampilan kalender di dashboard-calendar.tsx.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { parseNaturalTaskAction } from "./nl-task-actions";
import type { ParsedNaturalTask } from "./nl-input-schema";
import { NlPreviewCard } from "./nl-preview-card";

const SUGGESTIONS = [
  "Meeting desain besok jam 10:00 selama 45 menit",
  "Belajar TypeScript malam ini jam 20:00 1 jam",
  "Olahraga setiap hari jam 06:00 pagi prioritas tinggi",
  "Beli kebutuhan rumah Sabtu jam 09:00",
];

export function NlQuickInput() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedTask, setParsedTask] = useState<ParsedNaturalTask | null>(null);

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || isAnalyzing) return;

    setIsAnalyzing(true);
    setErrorMsg(null);

    const result = await parseNaturalTaskAction(clean);
    if (result.ok) {
      setParsedTask(result.data);
    } else {
      setErrorMsg(result.error.message || "Gagal menganalisis tugas dengan AI.");
    }

    setIsAnalyzing(false);
  }

  function handleSaved() {
    setParsedTask(null);
    setInputText("");
    router.refresh();
  }

  function handleCancel() {
    setParsedTask(null);
  }

  function handleSuggestionClick(text: string) {
    setInputText(text);
  }

  return (
    <div className="space-y-3">
      {/* Input Bar AI Minimalis */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center rounded-2xl border border-border/70 bg-white/80 p-1.5 shadow-xs backdrop-blur-xl transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 dark:border-white/10 dark:bg-slate-900/80"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik tugas dengan bahasa bebas (contoh: Meeting besok jam 10 pagi selama 45 menit)..."
          disabled={isAnalyzing}
          className="flex-1 bg-transparent px-3 text-xs font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground/60 sm:text-sm"
        />

        <button
          type="submit"
          disabled={isAnalyzing || !inputText.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:brightness-105 active:scale-95 disabled:opacity-40"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">Menganalisis...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Analisis AI</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Pesan Error jika AI gagal */}
      {errorMsg && (
        <p className="px-2 text-xs font-semibold text-destructive">{errorMsg}</p>
      )}

      {/* Kartu Preview AI jika sudah dianalisis */}
      {parsedTask && (
        <NlPreviewCard
          initialData={parsedTask}
          onCancel={handleCancel}
          onSaved={handleSaved}
        />
      )}

      {/* Saran Prompt Cepat */}
      {!parsedTask && !inputText && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-medium text-muted-foreground/80">
            Contoh:
          </span>
          {SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSuggestionClick(sug)}
              className="rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
            >
              ✦ {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
