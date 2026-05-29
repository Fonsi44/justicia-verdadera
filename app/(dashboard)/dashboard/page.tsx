"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  Receipt,
  Clock,
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  change,
  className,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  className?: string;
}) {
  return (
    <div
      className={`glass-card glass-card-hover p-6 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#8b8d91]">{label}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <Icon className="h-4 w-4 text-[#c8a45c]" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display text-3xl font-bold text-[#e8e4dd]">
          {value}
        </span>
        {change && (
          <span className="text-xs text-[#8b8d91]">
            <span className="text-[#8b9d83]">↑</span> {change}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">
          Panel de control
        </h1>
        <p className="mt-1 text-sm text-[#8b8d91]">
          Bienvenido a Justicia Verdadera. Aquí tienes un resumen de tu
          despacho.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Casos activos"
          value="24"
          icon={Briefcase}
          change="+3 este mes"
        />
        <StatCard
          label="Vistas próximas"
          value="8"
          icon={CalendarCheck}
          change="Próximos 7 días"
        />
        <StatCard
          label="Facturación pendiente"
          value="HNL 45,200"
          icon={Receipt}
        />
        <StatCard
          label="Horas facturables"
          value="142h"
          icon={Clock}
          change="+12h esta semana"
        />
      </div>

      {/* Quick Access & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Cases */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-[#e8e4dd]">
              Casos recientes
            </h2>
            <a
              href="/casos"
              className="text-xs text-[#c8a45c] hover:text-[#d4b36a] transition-colors"
            >
              Ver todos →
            </a>
          </div>
          <div className="space-y-3">
            {[
              { name: "Pérez vs. Constructora S.A.", matter: "Civil", date: "Hoy" },
              { name: "Defensa penal — Caso 0452-B", matter: "Penal", date: "Ayer" },
              { name: "Divorcio Martínez-López", matter: "Familia", date: "Hace 2 días" },
              { name: "Recurso de amparo fiscal", matter: "Contencioso", date: "Hace 3 días" },
            ].map((caso, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#c8a45c]/5 border border-[#c8a45c]/10">
                    <FileText className="h-3.5 w-3.5 text-[#c8a45c]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#e8e4dd]">{caso.name}</p>
                    <p className="text-xs text-[#8b8d91]">{caso.matter}</p>
                  </div>
                </div>
                <span className="text-xs text-[#8b8d91]">{caso.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-[#e8e4dd]">
              Plazos próximos
            </h2>
            <a
              href="/agenda"
              className="text-xs text-[#c8a45c] hover:text-[#d4b36a] transition-colors"
            >
              Ver agenda →
            </a>
          </div>
          <div className="space-y-3">
            {[
              { event: "Vista oral — Caso CV-2026-0042", date: "3 junio 2026", urgent: true },
              { event: "Presentación de recurso", date: "5 junio 2026", urgent: true },
              { event: "Audiencia conciliación", date: "10 junio 2026", urgent: false },
              { event: "Vencimiento plazo probatorio", date: "15 junio 2026", urgent: false },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-white/[0.03] last:border-0"
              >
                <div className="flex items-center gap-3">
                  {item.urgent ? (
                    <AlertTriangle className="h-4 w-4 text-[#e05a4f]" />
                  ) : (
                    <CalendarCheck className="h-4 w-4 text-[#8b8d91]" />
                  )}
                  <span className="text-sm text-[#e8e4dd]">{item.event}</span>
                </div>
                <span className={`text-xs ${item.urgent ? "text-[#e05a4f]" : "text-[#8b8d91]"}`}>
                  {item.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Nuevo caso", icon: Briefcase, href: "/casos/nuevo" },
          { label: "Nuevo cliente", icon: Users, href: "/clientes/nuevo" },
          { label: "Subir documento", icon: FileText, href: "/documentos/subir" },
        ].map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="glass-card glass-card-hover flex items-center gap-4 p-5 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c8a45c]/10 bg-[#c8a45c]/5 transition-colors group-hover:border-[#c8a45c]/20">
              <action.icon className="h-4 w-4 text-[#c8a45c]" />
            </div>
            <span className="text-sm font-medium text-[#e8e4dd]">
              {action.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
