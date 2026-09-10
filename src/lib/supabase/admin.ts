import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase client — Architecture §3.1
 *
 * ⚠️  WAJIB server-only. Jangan import dari Client Components atau features/tasks/.
 * ⚠️  Hanya untuk operasi briefings yang memerlukan bypass RLS.
 * ⚠️  "server-only" import guard akan throw error saat build jika diimport dari client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin client",
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
