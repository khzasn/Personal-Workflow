import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicKey } from "@/lib/env";

/**
 * Server (SSR) Supabase client — Architecture §3.1
 * Menggunakan cookie dari Next.js headers untuk menjaga session.
 * Gunakan di: Server Components, Server Actions, Route Handlers.
 * JANGAN gunakan di Client Components (gunakan browser.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getPublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll dipanggil dari Server Component — cookie tidak bisa di-set.
            // Ini aman jika middleware sudah me-refresh session.
          }
        },
      },
    },
  );
}
