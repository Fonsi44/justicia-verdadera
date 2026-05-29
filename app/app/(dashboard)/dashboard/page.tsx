"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CalendarCheck,
  Receipt,
  Clock,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";

function StatCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <div className="glass-card glass-card-hover p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#8b8d91]">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-4 w-4 text-[#c8a45c]" />
        </div>
      </div>
      {loading ? (
        <div className="h-9 w-24 rounded-md bg-white/[0.04] animate-pulse" />
      ) : (
        <div className="flex items-end justify-between">
          <span className="font-display text-3xl font-bold text-[#e8e4dd]">{value}</span>
          {subtitle && <span className="text-xs text-[#8b8d91]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const [fetchTime] = useState(() => Date.now());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">Panel de control</h1>
        <p className="mt-1 text-sm text-[#8b8d91]">
          Bienvenido a Justicia Verdadera. Aquí tienes un resumen de tu despacho.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Casos activos"
          value={stats?.activeCases?.toString() ?? "0"}
          icon={Briefcase}
          subtitle={stats ? `${stats.recentCases?.length ?? 0} recientes` : undefined}
          loading={loading}
        />
        <StatCard
          label="Vistas próximas"
          value={stats?.upcomingEvents?.toString() ?? "0"}
          icon={CalendarCheck}
          subtitle="Próximos 7 días"
          loading={loading}
        />
        <StatCard
          label="Facturación pendiente"
          value={stats ? formatCurrency(parseFloat(stats.pendingAmount ?? "0")) : "HNL 0"}
          icon={Receipt}
          subtitle={stats ? `${stats.pendingInvoices} facturas` : undefined}
          loading={loading}
        />
        <StatCard
          label="Horas facturables"
          value={stats ? `${stats.billableHours ?? 0}h` : "0h"}
          icon={Clock}
          subtitle="Sin facturar"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-[#e8e4dd]">Casos recientes</h2>
            <Link href="/casos" className="text-xs text-[#c8a45c] hover:text-[#d4b36a] transition-colors">
              Ver todos →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-white/[0.04] animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 rounded bg-white/[0.04] animate-pulse" />
                      <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse" />
                    </div>
                  </div>
                  <div className="h-3 w-16 rounded bg-white/[0.03] animate-pulse" />
                </div>
              ))}
            </div>
          ) : !stats?.recentCases?.length ? (
            <p className="text-center text-sm text-[#8b8d91] py-8">No hay casos recientes</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCases.map((caso) => (
                <Link
                  key={caso.id}
                  href={`/casos/${caso.id}`}
                  className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#c8a45c]/5 border border-[#c8a45c]/10">
                      <FileText className="h-3.5 w-3.5 text-[#c8a45c]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#e8e4dd]">{caso.title}</p>
                      <p className="text-xs text-[#8b8d91] capitalize">{caso.matter}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#8b8d91]">{formatDate(caso.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-[#e8e4dd]">Plazos próximos</h2>
            <Link href="/agenda" className="text-xs text-[#c8a45c] hover:text-[#d4b36a] transition-colors">
              Ver agenda →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded bg-white/[0.04] animate-pulse" />
                    <div className="h-4 w-56 rounded bg-white/[0.04] animate-pulse" />
                  </div>
                  <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse" />
                </div>
              ))}
            </div>
          ) : !stats?.upcomingDeadlines?.length ? (
            <p className="text-center text-sm text-[#8b8d91] py-8">No hay plazos próximos</p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((item) => {
                const eventDate = new Date(item.date).getTime();
                const isUrgent = eventDate - fetchTime < threeDays;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {isUrgent ? (
                        <AlertTriangle className="h-4 w-4 text-[#e05a4f] flex-shrink-0" />
                      ) : (
                        <CalendarCheck className="h-4 w-4 text-[#8b8d91] flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-sm text-[#e8e4dd]">{item.title}</span>
                        {item.case && (
                          <span className="ml-2 text-xs text-[#c8a45c]">
                            {item.case.number}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs flex-shrink-0 ${isUrgent ? "text-[#e05a4f]" : "text-[#8b8d91]"}`}
                    >
                      {formatDate(item.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Nuevo caso", icon: Briefcase, href: "/casos/nuevo" },
          { label: "Nuevo cliente", icon: Users, href: "/clientes/nuevo" },
          { label: "Subir documento", icon: FileText, href: "/documentos" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="glass-card glass-card-hover flex items-center gap-4 p-5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c8a45c]/10 bg-[#c8a45c]/5 transition-colors group-hover:border-[#c8a45c]/20">
              <action.icon className="h-4 w-4 text-[#c8a45c]" />
            </div>
            <span className="text-sm font-medium text-[#e8e4dd]">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
