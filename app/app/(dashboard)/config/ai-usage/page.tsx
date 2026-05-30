"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  Sparkles, AlertTriangle, Loader2, Save,
} from "lucide-react";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import StatCard from "@/components/stat-card";
import { formatCurrency } from "@/lib/utils";

interface UsageStats {
  totalPrompts: number;
  totalTokens: number;
  totalCost: number;
  promptsByDay: Array<{ date: string; count: number }>;
  currentPeriodUsage: number;
  periodLimit: number;
  spendingLimit: number;
  currentSpending: number;
  recentUsage: Array<{
    id: string;
    model: string;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number;
    cost: string | null;
    createdAt: string;
  }>;
}

export default function AiUsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitSaved, setLimitSaved] = useState(false);

  const fetchUsage = useCallback(() => {
    fetch("/api/ai/usage")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setStats(data);
        setLimitInput(String(data.spendingLimit));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const handleSaveLimit = async () => {
    setSavingLimit(true);
    try {
      const res = await fetch("/api/ai/usage/limit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spendingLimit: Number(limitInput) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats((prev) => prev ? { ...prev, spendingLimit: data.aiSpendingLimit } : prev);
      setEditingLimit(false);
      setLimitSaved(true);
      setTimeout(() => setLimitSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingLimit(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Uso de IA" description="Monitoreo del consumo de inteligencia artificial del despacho" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Uso de IA" description="Monitoreo del consumo de inteligencia artificial del despacho" />
        <SectionCard title="Error">
          <p className="text-sm text-destructive">{error}</p>
        </SectionCard>
      </div>
    );
  }

  if (!stats) return null;

  const nearLimit = stats.currentSpending > 0 && stats.spendingLimit > 0
    && (stats.currentSpending / stats.spendingLimit) >= 0.8;

  const promptsPercentage = stats.periodLimit > 0
    ? Math.min(100, Math.round((stats.currentPeriodUsage / stats.periodLimit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Uso de IA"
        description="Monitoreo del consumo de inteligencia artificial del despacho"
      />

      {nearLimit && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            Has alcanzado el <strong>{Math.round((stats.currentSpending / stats.spendingLimit) * 100)}%</strong> de tu límite de gasto en IA ({formatCurrency(stats.currentSpending)} de {formatCurrency(stats.spendingLimit)}).
            Considera aumentar el límite en esta página.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Prompts usados (mes)"
          value={`${stats.currentPeriodUsage} / ${stats.periodLimit}`}
          icon={Sparkles}
          variant={promptsPercentage > 80 ? "warning" : "primary"}
        />
        <StatCard
          label="Gasto actual (mes)"
          value={formatCurrency(stats.currentSpending)}
          icon={Sparkles}
          variant={nearLimit ? "warning" : "primary"}
        />
        <StatCard
          label="Total tokens"
          value={stats.totalTokens.toLocaleString()}
          icon={Sparkles}
        />
        <StatCard
          label="Costo total histórico"
          value={formatCurrency(stats.totalCost)}
          icon={Sparkles}
        />
      </div>

      <SectionCard title="Prompts por día (últimos 30 días)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.promptsByDay.length ? stats.promptsByDay : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Prompts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Límite de gasto mensual">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Límite actual: <strong>{formatCurrency(stats.spendingLimit)}</strong>.
            Gasto actual del mes: <strong>{formatCurrency(stats.currentSpending)}</strong>.
            La IA se bloqueará automáticamente al alcanzar el límite.
          </p>
          {editingLimit ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  L.
                </span>
                <input
                  type="number"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="h-10 w-40 rounded-lg border bg-background pl-8 pr-3 text-sm text-foreground ring-1 ring-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  step="50"
                />
              </div>
              <button
                onClick={handleSaveLimit}
                disabled={savingLimit}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-70"
              >
                {savingLimit ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar
              </button>
              <button
                onClick={() => { setEditingLimit(false); setLimitInput(String(stats.spendingLimit)); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingLimit(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Cambiar límite
            </button>
          )}
          {limitSaved && (
            <p className="text-sm text-emerald-600 animate-fade-in-up">
              Límite de gasto actualizado correctamente.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Uso reciente">
        {stats.recentUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros de uso de IA aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Modelo</th>
                  <th className="pb-2 pr-4 font-medium text-right">Tokens</th>
                  <th className="pb-2 font-medium text-right">Costo</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsage.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("es-HN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2 pr-4 text-foreground">
                      <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-mono">
                        {u.model}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right text-muted-foreground">
                      {u.totalTokens.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-muted-foreground">
                      ${Number(u.cost ?? 0).toFixed(5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
