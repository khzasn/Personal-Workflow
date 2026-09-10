"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  CalendarDays,
  BookOpen,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/jadwal",
    label: "Jadwal",
    icon: "calendar",
  },
  {
    href: "/jurnal",
    label: "Jurnal Harian",
    icon: "book",
  },
] as const;

type NavItemHref = typeof navItems[number]["href"];

function NavIcon({ type, className }: { type: string; className?: string }) {
  if (type === "dashboard") return <LayoutDashboard className={className} />;
  if (type === "calendar") return <CalendarDays className={className} />;
  if (type === "book") return <BookOpen className={className} />;
  return null;
}

interface SidebarProps {
  userEmail?: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-border/60 bg-background/80 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          collapsed ? "w-[68px]" : "w-[220px]"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                <CalendarCheck2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-extrabold tracking-tight truncate">Dayflow</span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Ciutkan sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Perluas sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <span className="shrink-0">
                  <NavIcon type={item.icon} className="h-5 w-5" />
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {userEmail && !collapsed && (
          <div className="border-t border-border/60 px-4 py-3">
            <p className="truncate text-[11px] font-medium text-muted-foreground">{userEmail}</p>
          </div>
        )}
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-[18px] left-4 z-40 md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/90 text-foreground shadow-sm backdrop-blur-lg"
        aria-label="Buka menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background shadow-xl flex flex-col">
            <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white shadow-md">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-extrabold tracking-tight">Dayflow</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="shrink-0">
                      <NavIcon type={item.icon} className="h-5 w-5" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            {userEmail && (
              <div className="border-t border-border/60 px-4 py-3">
                <p className="truncate text-[11px] font-medium text-muted-foreground">{userEmail}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}