"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, ChevronRight } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import SearchAndFilters from "@/components/search-and-filters";
import EmptyState from "@/components/empty-state";
import StatusBadge from "@/components/status-badge";
import LoadingSkeleton from "@/components/loading-skeleton";
import { useCases } from "@/hooks/use-cases";
import type { CaseData } from "@/types";

const matterLabels: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  mercantil: "Mercantil",
  contencioso: "Contencioso",
  constitucional: "Constitucional",
};

const matterColors: Record<string, string> = {
  civil: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  penal: "bg-red-500/10 text-red-700 border-red-500/20",
  laboral: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  familia: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  mercantil: "bg-green-500/10 text-green-700 border-green-500/20",
  contencioso: "bg-teal-500/10 text-teal-700 border-teal-500/20",
  constitucional: "bg-primary/10 text-primary border-primary/20",
};

const statusLabels: Record<string, string> = {
  activo: "Activo",
  archivado: "Archivado",
  cerrado: "Cerrado",
  suspendido: "Suspendido",
};

const priorityLabels: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const priorityColors: Record<string, string> = {
  urgente: "bg-red-500/10 text-red-700 border-red-500/20",
  alta: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  media: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  baja: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(val: string | null) {
  if (!val) return "—";
  const num = parseFloat(val);
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 0,
  }).format(num);
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function CasesClient() {
  const [search, setSearch] = useState("");
  const [matter, setMatter] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCases({ search, matter, status, page });

  const cases: CaseData[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Casos"
        description="Gestiona los casos y expedientes de tu despacho."
        actions={
          <Link href="/casos/nuevo">
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo caso
            </Button>
          </Link>
        }
      />

      <SearchAndFilters
        searchPlaceholder="Buscar casos por número o título..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        actions={
          <>
            <Select value={matter} onValueChange={(v) => { setMatter(v ?? ""); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {Object.entries(matterLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v ?? ""); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {isLoading ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6">
            <LoadingSkeleton variant="table" />
          </div>
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border bg-card shadow-sm">
          <EmptyState
            icon={Briefcase}
            title={search || matter || status ? "Sin resultados" : "No hay casos registrados"}
            description={
              search || matter || status
                ? "No se encontraron casos con los filtros actuales."
                : "Comienza creando tu primer caso."
            }
            action={
              !search && !matter && !status
                ? { label: "Crear primer caso", href: "/casos/nuevo" }
                : undefined
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Materia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Abogado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridad</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {cases.map((caso, i) => (
                  <tr
                    key={caso.id}
                    className="transition-colors hover:bg-muted/50 animate-fade-in-up cursor-pointer"
                    style={{ animationDelay: `${i * 0.06}s` }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Ver caso ${caso.number}: ${caso.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        window.location.href = `/casos/${caso.id}`;
                      }
                    }}
                    onClick={() => window.location.href = `/casos/${caso.id}`}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-primary font-medium">
                        {caso.number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[300px]">
                      <div>
                        <p className="text-sm text-foreground truncate">{caso.title}</p>
                        {caso.estimatedValue && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatCurrency(caso.estimatedValue)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge label={matterLabels[caso.matter] ?? caso.matter} className={matterColors[caso.matter] ?? ""} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={statusLabels[caso.status] ?? caso.status}
                        dot
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">{caso.assignedLawyer?.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">{formatDate(caso.startDate)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge label={priorityLabels[caso.priority] ?? caso.priority} className={priorityColors[caso.priority] ?? ""} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Mostrando {(page - 1) * 10 + 1}–{Math.min(page * 10, total)} de {total} casos
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-7 items-center rounded px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-7 items-center rounded px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
