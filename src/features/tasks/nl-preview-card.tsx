"use client";

/**
 * src/features/tasks/nl-preview-card.tsx
 * Kartu preview & konfirmasi interaktif hasil analisis AI (Natural-Language Task).
 * Pengguna dapat meninjau, mengubah field, memilih quick-reply chip,
 * dan mengonfirmasi penyimpanan ke kalender.
 */

import { useState } from "react";
import {
  Calendar,
  Check,
  Clock3,
  Flame,
  Info,
  Layers,
  Repeat,
  Sparkles,
  X,
} from "lucide-react";
import type { TaskCategory, TaskPriority } from "@/types";
import type { ParsedNaturalTask } from "./nl-input-schema";
import { createTask } from "./actions";
import { createTaskSeries } from "./recurrence/actions";

interface NlPreviewCardProps {
  initialData: ParsedNaturalTask;
  onCancel: () => void;
  onSaved: () => void;
}

const QUICK_TIME_CHIPS = [
  { label: "08:00 Pagi", time: "08:00" },
  { label: "09:00 Pagi", time: "09:00" },
  { label: "10:00 Pagi", time: "10:00" },
  { label: "13:00 Siang", time: "13:00" },
  { label: "14:00 Siang", time: "14:00" },
  { label: "19:00 Malam", time: "19:00" },
  { label: "20:00 Malam", time: "20:00" },
];

export function NlPreviewCard({
  initialData,
  onCancel,
  onSaved,
}: NlPreviewCardProps) {
  const [title, setTitle] = useState(initialData.title);
  const [scheduledDate, setScheduledDate] = useState(
    initialData.scheduled_date || ""
  );
  const [startTime, setStartTime] = useState(initialData.start_time || "");
  const [duration, setDuration] = useState(
    String(initialData.estimated_minutes || 30)
  );
  const [category, setCategory] = useState<TaskCategory>(
    initialData.category as TaskCategory
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialData.priority as TaskPriority
  );
  const [recurrence, setRecurrence] = useState(
    initialData.recurrence_frequency || "none"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const confidencePct = Math.round(initialData.confidence * 100);
  const isAmbiguous =
    initialData.confidence < 0.7 || Boolean(initialData.ambiguity_note);

  async function handleSave() {
    if (!title.trim()) {
      setErrorMsg("Judul tugas tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (recurrence !== "none") {
        const result = await createTaskSeries({
          title: title.trim(),
          category,
          priority,
          recurrenceRule: {
            frequency: recurrence,
            interval: 1,
            endsOn: null,
          },
          startsOn: scheduledDate || new Date().toISOString().slice(0, 10),
          startTime: startTime || null,
          estimatedMinutes: Number(duration) || 30,
        });

        if (result.ok) {
          onSaved();
        } else {
          setErrorMsg(result.error.message || "Gagal membuat tugas berulang.");
        }
      } else {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("category", category);
        formData.append("priority", priority);
        formData.append("estimated_minutes", duration);
        if (scheduledDate) formData.append("scheduled_date", scheduledDate);
        if (startTime) formData.append("start_time", startTime);

        const result = await createTask(formData, crypto.randomUUID());
        if (result.ok) {
          onSaved();
        } else {
          setErrorMsg(result.error.message || "Gagal menyimpan tugas.");
        }
      }
    } catch (err) {
      console.error("Gagal menyimpan tugas AI:", err);
      setErrorMsg("Terjadi kesalahan sistem saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="animate-fade-up rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-50/70 via-background to-indigo-50/50 p-4 shadow-xl backdrop-blur-xl dark:border-violet-500/20 dark:from-violet-950/25 dark:via-background dark:to-indigo-950/20 sm:p-5">
      {/* Header Preview & Confidence */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-600/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Konfirmasi Tugas AI
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Tinjau detail sebelum dimasukkan ke kalender
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              confidencePct >= 80
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : confidencePct >= 50
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            }`}
          >
            Akurasi AI {confidencePct}%
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Tutup preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Catatan Ambiguitas jika AI berasumsi */}
      {initialData.ambiguity_note && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{initialData.ambiguity_note}</p>
        </div>
      )}

      {/* Quick-reply chip jam jika jam kosong atau ambigu */}
      {isAmbiguous && !startTime && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">
            💡 Pilih jam cepat:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TIME_CHIPS.map((chip) => (
              <button
                key={chip.time}
                type="button"
                onClick={() => setStartTime(chip.time)}
                className="rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input yang Dapat Diedit */}
      <div className="mt-3.5 space-y-3 text-xs">
        {/* Judul Tugas */}
        <div>
          <label className="mb-1 block font-semibold text-muted-foreground">
            Judul Tugas
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Judul tugas..."
          />
        </div>

        {/* Grid Tanggal, Waktu, Durasi */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div>
            <label className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground">
              <Calendar className="h-3 w-3 text-primary" /> Tanggal
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground">
              <Clock3 className="h-3 w-3 text-primary" /> Jam Mulai
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-muted-foreground">
              Durasi
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="15">15 menit</option>
              <option value="30">30 menit</option>
              <option value="45">45 menit</option>
              <option value="60">1 jam</option>
              <option value="90">1,5 jam</option>
              <option value="120">2 jam</option>
            </select>
          </div>
        </div>

        {/* Grid Kategori, Prioritas, Pengulangan */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div>
            <label className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground">
              <Layers className="h-3 w-3 text-primary" /> Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="Kerja">Kerja</option>
              <option value="Belajar">Belajar</option>
              <option value="Pribadi">Pribadi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" /> Prioritas
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="urgent">🔴 Urgent (P1)</option>
              <option value="high">🟠 High (P2)</option>
              <option value="medium">🟣 Medium (P3)</option>
              <option value="low">⚪ Low (P4)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 font-semibold text-muted-foreground">
              <Repeat className="h-3 w-3 text-primary" /> Pengulangan
            </label>
            <select
              value={recurrence}
              onChange={(e) =>
                setRecurrence(
                  e.target.value as
                    | "none"
                    | "daily"
                    | "weekday"
                    | "weekly"
                    | "monthly"
                )
              }
              className="w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="none">Tidak berulang</option>
              <option value="daily">Setiap hari</option>
              <option value="weekday">Hari kerja (Sen-Jum)</option>
              <option value="weekly">Setiap minggu</option>
              <option value="monthly">Setiap bulan</option>
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <p className="mt-2 text-xs font-medium text-destructive">{errorMsg}</p>
      )}

      {/* Footer Action Buttons */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-xl px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
        >
          Batal
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 transition hover:brightness-110 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {isSaving ? "Menyimpan ke kalender..." : "Tambahkan ke Kalender"}
        </button>
      </div>
    </div>
  );
}
