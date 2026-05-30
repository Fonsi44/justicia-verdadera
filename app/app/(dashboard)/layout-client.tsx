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
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Session } from "next-auth";
import NotificationsDropdown from "@/components/notifications-dropdown";
import { ErrorBoundary } from "@/components/error-boundary";
import { HelpWidget } from "@/components/help-widget";

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

function SidebarContent({
  onClose,
}: {
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <span className="font-display text-xs font-bold text-sidebar-primary-foreground">
            JV
          </span>
        </div>
        <span className="font-display text-sm font-semibold text-sidebar-foreground tracking-wide">
          Justicia Verdadera
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
          >
            <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors duration-200" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          href="/config"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
        >
          <Settings className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors duration-200" />
          Configuración
        </Link>
        <Link
          href="/config/ai-usage"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
        >
          <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors duration-200" />
          Uso de IA
        </Link>
      </div>
    </>
  );
}

function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-14">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function DashboardLayoutClient({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = session?.user;
  const initials = getUserInitials(user?.name, user?.email);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar (slide-over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-sidebar-border bg-sidebar transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 z-20 border-r border-sidebar-border bg-sidebar overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64 pb-14 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              aria-label="Buscar"
              className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <div className="hidden sm:block h-6 w-px bg-border" />
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
        <main className="relative z-10 p-4 lg:p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Floating help button */}
      <HelpWidget />
    </div>
  );
}
