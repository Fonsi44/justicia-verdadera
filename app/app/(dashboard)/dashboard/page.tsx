"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Briefcase,
  CalendarCheck,
  Receipt,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Loader2,
  Scale,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";
import StatCard from "@/components/stat-card";
import SectionCard from "@/components/section-card";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isNewFirm, setIsNewFirm] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  const fetchDashboard = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
        if (
          data.activeCases === 0 &&
          data.totalContacts === 0 &&
          data.totalDocuments === 0
        ) {
          setIsNewFirm(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed-mock", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSeedDone(true);
      setIsNewFirm(false);
      fetchDashboard();
      setTimeout(() => setSeedDone(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const [fetchTime] = useState(() => Date.now());

  if (isNewFirm && !loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="animate-fade-in-up">
          <h1 className="font-display text-2xl font-bold text-foreground">Bienvenido a Justicia Verdadera</h1>
          <p className="mt-2 text-muted-foreground">
            Tu despacho ya está listo. Para que puedas explorar la plataforma, podemos generar datos de demostración con casos, clientes, documentos y facturas inspirados en la práctica legal hondureña.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 text-center ring-1 ring-foreground/10 animate-fade-in-up stagger-1">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            {seeding ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : seedDone ? (
              <Sparkles className="h-8 w-8 text-primary animate-fade-in-up" />
            ) : (
              <Scale className="h-8 w-8 text-primary" />
            )}
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-3">
            {seedDone ? "¡Datos generados con éxito!" : "¿Explorar la plataforma con datos de demostración?"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            {seedDone
              ? "Se han creado 12 casos, 12 contactos, 14 documentos, 8 facturas y eventos del calendario. Puedes eliminarlos cuando quieras."
              : "Generaremos casos legales realistas, contactos, facturas y eventos para que veas cómo funciona Justicia Verdadera con datos. Podrás eliminarlos en cualquier momento."}
          </p>
          {!seedDone && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg disabled:opacity-70"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando datos...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar datos de demostración
                </>
              )}
            </button>
          )}
          {seedDone && (
            <button
              onClick={() => { setIsNewFirm(false); fetchDashboard(); }}
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Ir al panel de control
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de control"
        description="Bienvenido a Justicia Verdadera. Aquí tienes un resumen de tu despacho."
        actions={
          isNewFirm && !seedDone ? (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Activar demo
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Casos activos"
          value={stats?.activeCases?.toString() ?? "0"}
          icon={Briefcase}
          subtitle={stats ? `${stats.recentCases?.length ?? 0} recientes` : undefined}
          loading={loading}
          variant="primary"
          index={0}
        />
        <StatCard
          label="Vistas próximas"
          value={stats?.upcomingEvents?.toString() ?? "0"}
          icon={CalendarCheck}
          subtitle="Próximos 7 días"
          loading={loading}
          variant="warning"
          index={1}
        />
        <StatCard
          label="Facturación pendiente"
          value={stats ? formatCurrency(parseFloat(stats.pendingAmount ?? "0")) : "HNL 0"}
          icon={Receipt}
          subtitle={stats ? `${stats.pendingInvoices} facturas` : undefined}
          loading={loading}
          variant="danger"
          index={2}
        />
        <StatCard
          label="Horas facturables"
          value={stats ? `${stats.billableHours ?? 0}h` : "0h"}
          icon={Clock}
          subtitle="Sin facturar"
          loading={loading}
          variant="default"
          index={3}
        />
      </div>

      {stats && stats.activeCases === 0 && stats.totalContacts === 0 && !seedDone && (
        <div className="flex items-center justify-between rounded-xl border bg-card p-5 ring-1 ring-foreground/10 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">¿Primera vez aquí?</p>
              <p className="text-xs text-muted-foreground">Genera datos demo para explorar todas las funcionalidades.</p>
            </div>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Activar demo
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Casos recientes"
          action={{ label: "Ver todos", href: "/casos" }}
          loading={loading}
        >
          {!stats?.recentCases?.length ? (
            <EmptyState
              icon={Briefcase}
              title="No hay casos registrados aún"
              description="Crea tu primer caso para empezar a gestionar expedientes."
              size="sm"
            />
          ) : (
            <div className="space-y-1">
              {stats.recentCases.map((caso, i) => (
                <Link
                  key={caso.id}
                  href={`/casos/${caso.id}`}
                  className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 transition-colors rounded-lg px-3 -mx-3 group"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 transition-colors group-hover:bg-primary/15">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors">{caso.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{caso.matter}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(caso.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Plazos próximos"
          action={{ label: "Ver agenda", href: "/agenda" }}
          loading={loading}
        >
          {!stats?.upcomingDeadlines?.length ? (
            <EmptyState
              icon={CalendarCheck}
              title="No hay plazos próximos"
              description="No tienes eventos o plazos programados para los próximos días."
              size="sm"
            />
          ) : (
            <div className="space-y-1">
              {stats.upcomingDeadlines.map((item, i) => {
                const eventDate = new Date(item.date).getTime();
                const isUrgent = eventDate - fetchTime < threeDays;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 transition-colors rounded-lg px-3 -mx-3"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="flex items-center gap-3">
                      {isUrgent ? (
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 animate-pulse" />
                      ) : (
                        <CalendarCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-sm text-foreground">{item.title}</span>
                        {item.case && (
                          <span className="ml-2 text-xs text-primary">
                            {item.case.number}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs flex-shrink-0 px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? "bg-destructive/10 text-destructive"
                          : "text-muted-foreground bg-muted"
                      }`}
                    >
                      {formatDate(item.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Casos por materia">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.casesByMatter?.length ? stats.casesByMatter : [{ name: "Sin datos", value: 1 }]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={3} dataKey="value"
                >
                  {(stats?.casesByMatter?.length ? stats.casesByMatter : [{ name: "Sin datos", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={["#2563eb", "#dc2626", "#d97706", "#059669", "#7c3aed", "#6b7280", "#0891b2", "#be185d"][i % 8]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {stats?.casesByMatter?.length ? (
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {stats.casesByMatter.map((m, i) => (
                <div key={m.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ["#2563eb", "#dc2626", "#d97706", "#059669", "#7c3aed", "#6b7280", "#0891b2", "#be185d"][i % 8] }} />
                  {m.name} ({m.value})
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Actividad mensual">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyActivity?.length ? stats.monthlyActivity : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="casos" fill="#2563eb" radius={[4, 4, 0, 0]} name="Casos" />
                <Bar dataKey="docs" fill="#7ea8c4" radius={[4, 4, 0, 0]} name="Documentos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-4">Acciones rápidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Nuevo caso", icon: Briefcase, href: "/casos/nuevo", desc: "Abrir expediente" },
            { label: "Nuevo cliente", icon: Users, href: "/clientes/nuevo", desc: "Registrar contacto" },
            { label: "Subir documento", icon: FileText, href: "/documentos", desc: "Gestionar archivos" },
          ].map((action, i) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10 hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20 transition-all duration-300 group"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary/15">
                <action.icon className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>

      {stats && stats.activeCases > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contactos</p>
              <p className="font-display text-xl font-bold text-foreground">{stats.totalContacts}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Documentos</p>
              <p className="font-display text-xl font-bold text-foreground">{stats.totalDocuments}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cuentas por cobrar</p>
              <p className="font-display text-xl font-bold text-foreground">
                {formatCurrency(parseFloat(stats.pendingAmount ?? "0"))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
