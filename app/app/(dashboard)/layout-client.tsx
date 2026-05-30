"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Calendar,
  Receipt,
  Settings,
  Search,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";
import NotificationsDropdown from "@/components/notifications-dropdown";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Casos", href: "/casos", icon: Briefcase },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Facturación", href: "/facturacion", icon: Receipt },
];

function getUserInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "JV";
}

export default function DashboardLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;
  const initials = getUserInitials(user?.name, user?.email);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 z-20 border-r border-sidebar-border bg-sidebar overflow-y-auto">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="font-display text-xs font-bold text-sidebar-primary-foreground">
              JV
            </span>
          </div>
          <span className="font-display text-sm font-semibold text-sidebar-foreground tracking-wide">
            Justicia Verdadera
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
            >
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors duration-200" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/config"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
          >
            <Settings className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors duration-200" />
            Configuración
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-4">
            <button
              aria-label="Buscar"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <div className="h-6 w-px bg-border" />
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full hover:bg-accent/50 transition-colors p-1 pr-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {user?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.image}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-semibold">{initials}</span>
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium text-foreground">
                  {user?.name ?? "Usuario"}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-card shadow-lg z-20">
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-10 p-6">{children}</main>
      </div>
    </div>
  );
}