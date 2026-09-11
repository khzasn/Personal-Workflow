"use client";

/**
 * src/features/journal/journal-editor.tsx
 * Form untuk menulis entri jurnal harian baru.
 */

import { useState, useTransition } from "react";
import { createJournalEntry } from "./actions";
import type { JournalEntry } from "./actions";
import { BookOpen, Loader2, Send, Sparkles } from "lucide-react";

const MOODS: { value: JournalEntry["mood"]; emoji: string; label: string }[] =
  [
    { value: "happy", emoji: "😊", label: "Senang" },
    { value: "excited", emoji: "🤩", label: "Bersemangat" },
    { value: "neutral", emoji: "😐", label: "Biasa" },
    { value: "tired", emoji: "😴", label: "Lelah" },
    { value: "sad", emoji: "😔", label: "Sedih" },
  ];

interface JournalEditorProps {
  onSaved?: () => void;
}

export function JournalEditor({ onSaved }: JournalEditorProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>("neutral");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createJournalEntry({ content, mood });
      if (result.success) {
        setContent("");
        setOriginalContent(null);
        setMood("neutral");
        onSaved?.();
      } else {
        setError(result.error ?? "Terjadi kesalahan.");
      }
    });
  }

  async function handlePolish() {
    if (content.trim().length < 10) return;
    setIsPolishing(true);
    setError(null);
    setOriginalContent(content); // Save original just in case

    const { polishJournalWithAI } = await import("./actions");
    const result = await polishJournalWithAI(content);

    if (result.success && result.polished) {
      setContent(result.polished);
    } else {
      setError(result.error || "Gagal memoles jurnal.");
      setOriginalContent(null);
    }
    setIsPolishing(false);
  }

  function handleRestore() {
    if (originalContent) {
      setContent(originalContent);
      setOriginalContent(null);
    }
  }

  const charCount = content.trim().length;

  return (
    <div className="rounded-[24px] border border-white/60 bg-white/70 p-5 shadow-xs backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
          <BookOpen className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Tulis Jurnal Hari Ini
          </h2>
          <p className="text-xs text-muted-foreground">
            Bagaimana harimu? Tuangkan pikiranmu di sini.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">


        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ceritakan harimu... Apa yang kamu syukuri? Apa yang ingin kamu perbaiki besok?"
            rows={6}
            className="w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={isPending || isPolishing}
          />
          <span className="absolute bottom-3 right-3 text-[11px] text-muted-foreground/60">
            {charCount} karakter
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Submit & Polish */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePolish}
              disabled={isPending || isPolishing || charCount < 10}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-600 transition-all hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
            >
              {isPolishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isPolishing ? "Memoles..." : "Poles dengan AI"}
            </button>
            {originalContent && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={isPending || isPolishing}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Kembalikan teks asli
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || isPolishing || charCount === 0}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isPending ? "Menyimpan..." : "Simpan Jurnal"}
          </button>
        </div>
      </form>
    </div>
  );
}
