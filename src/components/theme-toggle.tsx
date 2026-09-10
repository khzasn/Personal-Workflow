"use client";

/**
 * src/components/theme-toggle.tsx
 * Komponen pemilih tema (Light / Dark / System) menggunakan next-themes.
 * Mencegah hydration mismatch dengan flag mounted.
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-full border border-border/40 bg-muted/20" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm transition hover:scale-105 hover:border-primary hover:text-foreground active:scale-95"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 hover:-rotate-12 text-violet-600" />
      )}
    </button>
  );
}
