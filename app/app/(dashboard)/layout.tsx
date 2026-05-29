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
    <div className="flex min-h-screen bg-[#080b12]">
      {/* Overlay grid pattern */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 z-20 border-r border-white/[0.04] bg-[#0a0e17]">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.04] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c8a45c]/20 bg-[#c8a45c]/10">
            <span className="font-display text-xs font-bold text-[#c8a45c]">
              JV
            </span>
          </div>
          <span className="font-display text-sm font-semibold text-[#e8e4dd] tracking-wide">
            Justicia Verdadera
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8b8d91] hover:bg-white/[0.03] hover:text-[#e8e4dd] transition-all duration-200 group"
            >
              <item.icon className="h-4 w-4 text-[#8b8d91] group-hover:text-[#c8a45c] transition-colors duration-200" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/[0.04] p-3">
          <Link
            href="/config"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8b8d91] hover:bg-white/[0.03] hover:text-[#e8e4dd] transition-all duration-200 group"
          >
            <Settings className="h-4 w-4 text-[#8b8d91] group-hover:text-[#c8a45c] transition-colors duration-200" />
            Configuración
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/[0.04] bg-[#080b12]/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-4">
            <button className="text-[#8b8d91] hover:text-[#e8e4dd] transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-[#8b8d91] hover:text-[#e8e4dd] transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#c8a45c]" />
            </button>
            <div className="h-6 w-px bg-white/[0.06]" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#c8a45c]/10 border border-[#c8a45c]/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-[#c8a45c]">
                  AD
                </span>
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
