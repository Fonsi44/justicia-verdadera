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
  Bell,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Casos", href: "/casos", icon: Briefcase },
  { label: "Clientes", href: "/clientes", icon: Users },
  { label: "Documentos", href: "/documentos", icon: FileText },
  { label: "Agenda", href: "/agenda", icon: Calendar },
  { label: "Facturación", href: "/facturacion", icon: Receipt },
];

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 z-20 border-r border-sidebar-border bg-sidebar">
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
            <button
              aria-label="Notificaciones"
              className="relative text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-xs font-semibold">AD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-10 p-6">{children}</main>
      </div>
    </div>
  );
}
