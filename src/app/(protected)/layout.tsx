import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Protected layout — Architecture §4.1
 * Server Component yang memverifikasi session.
 * Jika tidak ada session, redirect ke /login.
 * Middleware sudah menangani ini, tapi ini sebagai lapisan keamanan tambahan.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
