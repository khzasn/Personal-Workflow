import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";

/**
 * Protected layout — Architecture §4.1
 * Server Component yang memverifikasi session.
 * Layout shell dengan sidebar navigasi kiri + header bersama.
 * Semua halaman di bawah (protected) otomatis mendapat sidebar.
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar kiri (Client Component) */}
      <Sidebar userEmail={user.email} />

      {/* Area konten utama */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header bersama */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          {/* Spacer untuk hamburger di mobile (44px = h-9 w-9 + gap) */}
          <div className="w-11 md:hidden" />

          {/* Kanan: actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Keluar"
                title="Keluar dari akun"
                className="flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-muted hover:text-foreground sm:px-3"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

