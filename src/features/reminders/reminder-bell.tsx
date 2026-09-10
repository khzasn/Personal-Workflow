"use client";

/**
 * src/features/reminders/reminder-bell.tsx
 * Tombol lonceng pengingat di navbar dengan menu popover
 * untuk mengatur izin notifikasi browser dan sakelar suara bel.
 */

import { useState, useRef, useEffect } from "react";
import { Bell, BellOff, Volume2, VolumeX, Sparkles, Check, AlertCircle } from "lucide-react";
import { useReminder } from "./reminder-context";

export function ReminderBell() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const {
    permission,
    isSoundEnabled,
    requestPermission,
    toggleSound,
    testSound,
  } = useReminder();

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isGranted = permission === "granted";

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Pengaturan Alarm & Notifikasi"
        aria-label="Pengaturan Alarm & Notifikasi"
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-xs transition hover:scale-105 hover:border-primary hover:text-foreground active:scale-95"
      >
        {isSoundEnabled ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground/60" />
        )}

        {/* Status indicator dot */}
        <span
          className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background ${
            isGranted && isSoundEnabled ? "bg-emerald-500" : "bg-amber-400"
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-72 origin-top-right rounded-2xl border border-border/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 dark:border-white/10 dark:bg-slate-900/95">
          <div className="mb-2.5 flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold text-foreground">
              Alarm & Pengingat
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isGranted
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isGranted ? "Notif Aktif" : "Izin Dibutuhkan"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Status Izin Notifikasi Browser */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">
                  Notifikasi Layar/OS
                </span>
                {isGranted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    Diizinkan
                  </span>
                ) : permission === "denied" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Diblokir
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={requestPermission}
                    className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-2xs transition hover:brightness-105"
                  >
                    Izinkan
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {isGranted
                  ? "Pengingat akan muncul di layar desktop & HP saat jam tugas tiba."
                  : "Aktifkan agar Anda mendapat pemberitahuan saat membuka tab lain."}
              </p>
            </div>

            {/* 2. Sakelar Suara Bel */}
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-2.5">
              <div className="flex items-center gap-2">
                {isSoundEnabled ? (
                  <Volume2 className="h-4 w-4 text-primary" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold text-foreground">Suara Bel (Chime)</span>
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isSoundEnabled ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={isSoundEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isSoundEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* 3. Tombol Uji Coba Suara Bel */}
            <button
              type="button"
              onClick={testSound}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-background/80 py-2 text-xs font-semibold text-foreground transition hover:bg-muted active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Uji Coba Suara Bel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
