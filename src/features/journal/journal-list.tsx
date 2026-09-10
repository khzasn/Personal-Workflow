"use client";

/**
 * src/features/journal/journal-list.tsx
 * Daftar entri jurnal harian, dengan expand/collapse dan hapus.
 */

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronDown, ChevronUp, Trash2, BookOpen } from "lucide-react";
import type { JournalEntry } from "./actions";
import { deleteJournalEntry } from "./actions";

const MOOD_MAP: Record<JournalEntry["mood"], { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😊", label: "Senang", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  excited: { emoji: "🤩", label: "Bersemangat", color: "text-violet-600 bg-violet-50 dark:bg-violet-900/20" },
  neutral: { emoji: "😐", label: "Biasa", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  tired: { emoji: "😴", label: "Lelah", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
  sad: { emoji: "😔", label: "Sedih", color: "text-rose-600 bg-rose-50 dark:bg-rose-900/20" },
};

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const mood = MOOD_MAP[entry.mood];
  const isLong = entry.content.length > 200;
  const displayContent =
    !expanded && isLong ? entry.content.slice(0, 200) + "…" : entry.content;

  function handleDelete() {
    if (!confirm("Yakin ingin menghapus entri jurnal ini?")) return;
    startTransition(async () => {
      await deleteJournalEntry(entry.id);
      onDelete(entry.id);
    });
  }

  return (
    <article className="group rounded-2xl border border-border/60 bg-background/60 p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mood badge */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${mood.color}`}
          >
            <span className="text-sm leading-none">{mood.emoji}</span>
            {mood.label}
          </span>
          {/* Date */}
          <time className="text-[11px] text-muted-foreground">
            {format(new Date(entry.created_at), "EEEE, d MMMM yyyy · HH:mm", {
              locale: id,
            })}
          </time>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
          aria-label="Hapus entri"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {displayContent}
      </p>

      {/* Expand/Collapse */}
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Tampilkan lebih sedikit
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Baca selengkapnya
            </>
          )}
        </button>
      )}
    </article>
  );
}

interface JournalListProps {
  initialEntries: JournalEntry[];
}

export function JournalList({ initialEntries }: JournalListProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 py-16 text-center text-muted-foreground">
        <BookOpen className="mb-3 h-10 w-10 opacity-20" />
        <p className="text-base font-semibold">Belum ada entri jurnal</p>
        <p className="mt-1 max-w-xs text-xs">
          Tuliskan jurnal pertamamu di atas. Satu baris pun sudah berarti!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <JournalEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
      ))}
    </div>
  );
}
