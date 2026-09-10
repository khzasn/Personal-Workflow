"use client";

/**
 * src/features/journal/journal-editor.tsx
 * Form untuk menulis entri jurnal harian baru.
 */

import { useState, useTransition } from "react";
import { createJournalEntry } from "./actions";
import type { JournalEntry } from "./actions";
import { BookOpen, Loader2, Send } from "lucide-react";

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createJournalEntry({ content, mood });
      if (result.success) {
        setContent("");
        setMood("neutral");
        onSaved?.();
      } else {
        setError(result.error ?? "Terjadi kesalahan.");
      }
    });
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
        {/* Mood Selector */}
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Suasana hati
          </p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  mood === m.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ceritakan harimu... Apa yang kamu syukuri? Apa yang ingin kamu perbaiki besok?"
            rows={6}
            className="w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={isPending}
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

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || charCount === 0}
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
