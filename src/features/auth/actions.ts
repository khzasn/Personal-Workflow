"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "./schemas";
import type { ActionResult } from "@/types";

/**
 * Server Action: Sign In — Architecture §4.5
 * Dipanggil dari LoginForm Client Component.
 */
export async function signIn(
  _prevState: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // 1. Validasi input
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  // 2. Login via Supabase Auth
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message:
          error.message === "Invalid login credentials"
            ? "Email atau password salah"
            : "Gagal login, coba lagi",
      },
    };
  }

  // 3. Redirect ke dashboard (middleware akan memverifikasi session)
  redirect("/dashboard");
}

/**
 * Server Action: Sign Up — Architecture §4.5
 * Dipanggil dari RegisterForm Client Component.
 */
export async function signUp(
  _prevState: ActionResult<{ email: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string }>> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // 1. Validasi input
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Data tidak valid",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      },
    };
  }

  // 2. Daftar via Supabase Auth
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error.message.includes("already registered")
            ? "Email sudah terdaftar, silakan login"
            : "Gagal mendaftar, coba lagi",
      },
    };
  }

  return { ok: true, data: { email: parsed.data.email } };
}

/**
 * Server Action: Sign Out — Architecture §4.5
 * Dipanggil dari tombol logout di layout dashboard.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
