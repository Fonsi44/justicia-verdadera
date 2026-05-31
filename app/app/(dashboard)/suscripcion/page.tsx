"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Sparkles, Loader2, ArrowRight, ArrowUp, BookOpen } from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PlanTier = "starter" | "profesional" | "despacho" | "enterprise";

interface PlanInfo {
  tier: PlanTier;
  limits: { users: number; cases: number; prompts: number; documents: number; storage: number };
  usage: { users: number; cases: number; documents: number; prompts: number; storage: number };
  subscriptionStatus: string;
  subscriptionEndDate: string | null;
  aiSpendingLimit: number;
}

const PLANS: { tier: PlanTier; label: string; price: string; description: string; limits: { users: number; cases: number; prompts: number; documents: number; storage: number } }[] = [
  { tier: "starter", label: "Starter", price: "L. 750/mes", description: "Para abogados independientes", limits: { users: 1, cases: 20, prompts: 10, documents: 50, storage: 500 } },
  { tier: "profesional", label: "Profesional", price: "L. 2,050/mes", description: "Para despachos pequeños", limits: { users: 3, cases: 100, prompts: 50, documents: 200, storage: 2048 } },
  { tier: "despacho", label: "Despacho", price: "L. 5,150/mes", description: "Para despachos en crecimiento", limits: { users: 10, cases: 500, prompts: 200, documents: 500, storage: 10240 } },
  { tier: "enterprise", label: "Enterprise", price: "A medida", description: "Para grandes despachos", limits: { users: 50, cases: 2000, prompts: 1000, documents: 5000, storage: 102400 } },
];

const PLAN_ORDER: PlanTier[] = ["starter", "profesional", "despacho", "enterprise"];

export default function SuscripcionPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/usage/limit")
      .then((r) => r.json())
      .then(() => fetch("/api/firm")
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setPlan({
              tier: (json.data.subscriptionTier || "starter") as PlanTier,
              limits: { users: 1, cases: 20, prompts: 10, documents: 50, storage: 500 },
              usage: { users: json.data.userCount || 0, cases: 0, documents: 0, prompts: 0, storage: 0 },
              subscriptionStatus: json.data.subscriptionStatus || "trial",
              subscriptionEndDate: json.data.subscriptionEndDate || null,
              aiSpendingLimit: Number(json.data.aiSpendingLimit || 200),
            });
          }
        }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentIndex = plan ? PLAN_ORDER.indexOf(plan.tier) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suscripción y Planes"
        description="Gestiona tu plan y límites de uso"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Suscripción" }]}
      />

      {plan && (
        <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plan actual</p>
              <p className="text-xl font-semibold text-foreground capitalize">{plan.tier}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className={
                plan.subscriptionStatus === "active" ? "bg-emerald-600/10 text-emerald-600" :
                plan.subscriptionStatus === "trial" ? "bg-amber-600/10 text-amber-600" :
                "bg-red-600/10 text-red-600"
              }>
                {plan.subscriptionStatus === "active" ? "Activo" :
                 plan.subscriptionStatus === "trial" ? "Trial" : plan.subscriptionStatus}
              </Badge>
            </div>
          </div>
          {plan.subscriptionEndDate && (
            <p className="mt-2 text-sm text-muted-foreground">
              Válido hasta: {new Date(plan.subscriptionEndDate).toLocaleDateString("es-HN")}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {PLANS.map((p, i) => {
          const isCurrent = plan?.tier === p.tier;
          const isUpgrade = plan && i > currentIndex;
          return (
            <div key={p.tier} className={`relative rounded-xl border bg-card p-6 ring-1 transition-all ${
              isCurrent ? "ring-2 ring-primary shadow-md" : "ring-foreground/10"
            }`}>
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Actual
                </span>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{p.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-4 text-2xl font-bold text-foreground">{p.price}</p>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{p.limits.users} {p.limits.users === 1 ? "usuario" : "usuarios"}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Hasta {p.limits.cases} casos activos</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{p.limits.prompts} prompts IA/mes</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Hasta {p.limits.documents} documentos</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{p.limits.storage >= 1024 ? `${p.limits.storage / 1024} GB` : `${p.limits.storage} MB`} almacenamiento</span>
                </li>
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button disabled className="w-full gap-2" variant="outline">
                    <Check className="h-4 w-4" /> Plan actual
                  </Button>
                ) : (
                  <Button className="w-full gap-2" variant={isUpgrade ? "default" : "outline"}>
                    {isUpgrade ? <><ArrowUp className="h-4 w-4" />Mejorar plan</> : "Ver plan"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Corpus Legal Especializado Honduras</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Todos los planes incluyen acceso completo al corpus legal más extenso de Honduras en formato digital.
          Textos extraídos directamente de los PDFs oficiales del Poder Judicial, TSC, SAR y Secretaría de Trabajo.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold text-foreground">9</p>
            <p className="text-xs text-muted-foreground">Códigos principales</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold text-foreground">877K</p>
            <p className="text-xs text-muted-foreground">Palabras indexadas</p>
          </div>
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-2xl font-bold text-foreground">24</p>
            <p className="text-xs text-muted-foreground">Fuentes legales</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />Constitución, Civil, Penal, Trabajo, Comercio, Familia</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />Procesal Civil, Procesal Penal, Tributario, ISR, Amparo</li>
          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />Jurisprudencia CSJ, Leyes especiales, Tratados internacionales</li>
        </ul>
      </div>

      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Límite de gasto en IA</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Controla el gasto mensual en prompts de IA. Al alcanzar el límite, la IA se deshabilita hasta el próximo ciclo.
        </p>
        <div className="flex items-center gap-4">
          {plan && (
            <span className="text-sm text-muted-foreground">
              Límite actual: <strong className="text-foreground">L. {plan.aiSpendingLimit.toFixed(2)}</strong>
            </span>
          )}
          <Button variant="outline" size="sm" render={<Link href="/config/ai-usage" />} nativeButton={false}>
            Ver consumo
          </Button>
        </div>
      </div>
    </div>
  );
}
