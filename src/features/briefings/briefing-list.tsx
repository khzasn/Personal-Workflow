"use client";

import { useTransition } from "react";
import { refreshBriefingAction } from "./actions";
import type { Briefing } from "@/types";
import { RefreshCw, Newspaper, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function BriefingList({ briefings }: { briefings: Briefing[] }) {
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      refreshBriefingAction();
    });
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Briefing Harian & Ringkasan Berita AI
            </h2>
            <p className="text-xs text-muted-foreground">
              Intisari 3 poin berita terkini yang diringkas oleh Gemini AI
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-secondary px-3.5 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          <span>{isPending ? "Meringkas Berita..." : "Segarkan Briefing"}</span>
        </button>
      </div>

      {/* Content Section: Horizontal Responsive Grid */}
      <div className="p-6">
        {briefings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            <Newspaper className="mb-3 h-10 w-10 opacity-20" />
            <p className="text-base font-semibold">Belum ada briefing hari ini</p>
            <p className="text-xs mt-1 max-w-sm">
              Klik tombol &ldquo;Segarkan Briefing&rdquo; di atas untuk menarik artikel berita terbaru dan menghasilkan ringkasan AI.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {briefings.map((b) => (
              <article
                key={b.id}
                className="flex flex-col justify-between rounded-xl border bg-background/50 p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="space-y-3">
                  {/* Article Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-primary/80 uppercase tracking-wider text-[10px] bg-primary/10 px-2 py-0.5 rounded">
                      {b.source_name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      {b.published_at
                        ? format(new Date(b.published_at), "d MMM, HH:mm", { locale: id })
                        : "Baru saja"}
                    </span>
                  </div>

                  {/* Article Title with Link */}
                  <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
                    <a
                      href={b.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline inline-flex items-start gap-1 group"
                    >
                      <span>{b.article_title}</span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-primary" />
                    </a>
                  </h3>

                  {/* 3 AI Bullet Points */}
                  <ul className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                    {b.summary.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="font-bold text-primary text-[10px] mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-2 border-t text-[11px] text-right text-muted-foreground">
                  <a
                    href={b.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Baca artikel lengkap &rarr;
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
