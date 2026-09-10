"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signUp } from "@/features/auth/actions";
import type { ActionResult } from "@/types";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Memproses..." : "Daftar"}
    </button>
  );
}

const initialState: ActionResult<{ email: string }> | null = null;

export function RegisterForm() {
  const [state, formAction] = useActionState(signUp, initialState);
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess || (state && state.ok)) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="text-5xl">📧</div>
        <h2 className="text-2xl font-bold">Cek Email Anda!</h2>
        <p className="text-muted-foreground">
          Kami telah mengirimkan link konfirmasi ke email Anda. Klik link
          tersebut untuk mengaktifkan akun, lalu login.
        </p>
        <Link
          href="/login"
          className="inline-block font-medium text-primary hover:underline"
        >
          Kembali ke halaman login →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Buat Akun</h1>
        <p className="text-muted-foreground">
          Mulai kelola produktivitasmu hari ini
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {/* Global error */}
        {state && !state.ok && !state.error.fieldErrors && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error.message}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          {state && !state.ok && state.error.fieldErrors?.email && (
            <p className="text-xs text-destructive">
              {state.error.fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Minimal 8 karakter"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          {state && !state.ok && state.error.fieldErrors?.password && (
            <p className="text-xs text-destructive">
              {state.error.fieldErrors.password[0]}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Konfirmasi Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Ulangi password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          {state && !state.ok && state.error.fieldErrors?.confirmPassword && (
            <p className="text-xs text-destructive">
              {state.error.fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
