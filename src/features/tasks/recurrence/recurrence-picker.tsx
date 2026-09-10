"use client";

/**
 * src/features/tasks/recurrence/recurrence-picker.tsx
 * Komponen UI untuk memilih pola perulangan tugas (Recurring Task).
 * Desain bersih dengan visual Dayflow dan kontrol yang intuitif.
 */

import { useState } from "react";
import { Repeat } from "lucide-react";
import type { RecurrenceFrequency, RecurrenceRule } from "@/types";

interface RecurrencePickerProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "none", label: "Tidak berulang" },
  { value: "daily", label: "Setiap hari" },
  { value: "weekday", label: "Hari kerja (Sen - Jum)" },
  { value: "weekly", label: "Setiap minggu" },
  { value: "monthly", label: "Setiap bulan" },
  { value: "custom", label: "Kustom…" },
];

const WEEKDAY_NAMES = [
  { id: 1, label: "Sen" },
  { id: 2, label: "Sel" },
  { id: 3, label: "Rab" },
  { id: 4, label: "Kam" },
  { id: 5, label: "Jum" },
  { id: 6, label: "Sab" },
  { id: 7, label: "Min" },
];

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const [isCustomExpanded, setIsCustomExpanded] = useState(value.frequency === "custom");

  function handleFrequencySelect(freq: RecurrenceFrequency) {
    if (freq === "custom") {
      setIsCustomExpanded(true);
      onChange({
        frequency: "custom",
        interval: value.interval || 1,
        weekdays: value.weekdays || [1],
        endsOn: value.endsOn,
      });
    } else {
      setIsCustomExpanded(false);
      onChange({
        frequency: freq,
        interval: 1,
        weekdays: freq === "weekday" ? [1, 2, 3, 4, 5] : undefined,
        endsOn: value.endsOn,
      });
    }
  }

  function toggleWeekday(dayId: number) {
    const currentDays = value.weekdays || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((d) => d !== dayId)
      : [...currentDays, dayId].sort();

    // Jangan biarkan kosong, minimal 1 hari terpilih
    if (newDays.length > 0) {
      onChange({ ...value, weekdays: newDays });
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Repeat className="h-3.5 w-3.5 text-primary" />
        <span>Pengulangan</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FREQUENCY_OPTIONS.map((opt) => {
          const isSelected = value.frequency === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFrequencySelect(opt.value)}
              className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Bagian Pengaturan Tambahan untuk Kustom / Berulang */}
      {value.frequency !== "none" && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-2.5 space-y-2.5 text-xs">
          {/* Pemilih Hari jika mode Kustom */}
          {isCustomExpanded && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">
                Ulangi pada hari:
              </label>
              <div className="flex flex-wrap gap-1">
                {WEEKDAY_NAMES.map((day) => {
                  const isChecked = (value.weekdays || []).includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleWeekday(day.id)}
                      className={`h-7 w-8 rounded-lg text-[11px] font-bold transition-all ${
                        isChecked
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "border border-border/60 bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opsi Tanggal Berakhir (Opsional) */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
            <label htmlFor="ends_on" className="text-[11px] font-medium text-muted-foreground">
              Berakhir pada (opsional):
            </label>
            <input
              id="ends_on"
              type="date"
              value={value.endsOn || ""}
              onChange={(e) => onChange({ ...value, endsOn: e.target.value || null })}
              className="rounded-lg border border-border/60 bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
