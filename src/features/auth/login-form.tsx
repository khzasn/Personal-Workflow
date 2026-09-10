"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  Timer,
} from "lucide-react";
import { signIn } from "@/features/auth/actions";
import type { ActionResult } from "@/types";

const initialState: ActionResult<{ email: string }> | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          Menyiapkan ruangmu...
        </>
      ) : (
        <>
          Masuk ke Dayflow
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const emailError =
    state && !state.ok ? state.error.fieldErrors?.email?.[0] : undefined;
  const passwordError =
    state && !state.ok ? state.error.fieldErrors?.password?.[0] : undefined;
  const globalError =
    state && !state.ok && !state.error.fieldErrors ? state.error.message : undefined;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#faf9ff] dark:bg-[#0b0b13]">
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 top-32 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-full bg-gradient-to-t from-indigo-950/30 to-transparent" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/20 backdrop-blur">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">Dayflow</p>
              <p className="text-xs font-medium text-violet-100">
                Your day, in flow ✦
              </p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-50 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Plan with clarity
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-[-0.05em] xl:text-6xl">
              Waktumu layak
              <span className="block text-violet-200">direncanakan dengan tenang.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-violet-100/85 xl:text-lg">
              Susun fokus, beri ruang untuk istirahat, dan jalani harimu satu blok
              pada satu waktu.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 backdrop-blur">
                <Timer className="h-4 w-4 text-violet-200" />
                Time blocking
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/10 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Fokus yang realistis
              </div>
            </div>
          </div>

          <div className="relative rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Hari ini</p>
                <p className="mt-0.5 text-xs text-violet-100/70">
                  Sedikit progress tetap berarti
                </p>
              </div>
              <span className="rounded-full bg-emerald-300/20 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
                3 agenda
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <span className="text-xs font-bold text-violet-200">09:00</span>
                <span className="h-8 w-1 rounded-full bg-blue-300" />
                <div>
                  <p className="text-xs font-bold">Deep work session</p>
                  <p className="text-[10px] text-violet-100/65">60 menit · Kerja</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">
                <span className="text-xs font-bold text-violet-200">11:00</span>
                <span className="h-8 w-1 rounded-full bg-emerald-300" />
                <div>
                  <p className="text-xs font-bold">Belajar hal baru</p>
                  <p className="text-[10px] text-violet-100/65">30 menit · Belajar</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md animate-fade-up">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-black tracking-tight">Dayflow</p>
                <p className="text-[11px] text-muted-foreground">
                  Your day, in flow ✦
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-35px_rgba(76,29,149,0.35)] backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.04] sm:p-8">
              <div className="mb-7">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  <Sparkles className="h-3 w-3" />
                  Welcome back
                </div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">
                  Selamat datang kembali
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Masuk dan lanjutkan flow produktifmu hari ini.
                </p>
              </div>

              <form action={formAction} className="space-y-4">
                {globalError && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
                  >
                    {globalError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(emailError)}
                      placeholder="nama@email.com"
                      className="w-full rounded-2xl border border-input bg-background/70 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs font-medium text-destructive">{emailError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      aria-invalid={Boolean(passwordError)}
                      placeholder="Masukkan password"
                      className="w-full rounded-2xl border border-input bg-background/70 py-3 pl-10 pr-11 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-xs font-medium text-destructive">{passwordError}</p>
                  )}
                </div>

                <div className="pt-2">
                  <SubmitButton />
                </div>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  New here?
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-bold text-primary transition hover:text-primary/80 hover:underline"
                >
                  Buat akun gratis
                </Link>
              </p>
            </div>

            <p className="mt-5 text-center text-[11px] text-muted-foreground/70">
              Fokus pada progres, bukan kesempurnaan ✦
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
