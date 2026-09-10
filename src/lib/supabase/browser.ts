import { createBrowserClient } from "@supabase/ssr";
import { getPublicKey } from "@/lib/env";

/**
 * Browser (Client Component) Supabase client.
 * Menggunakan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY atau NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Architecture §3.1 — hanya untuk operasi yang memerlukan user context di browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getPublicKey(),
  );
}
