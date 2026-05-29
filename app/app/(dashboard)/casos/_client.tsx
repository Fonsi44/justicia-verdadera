"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  civil: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  penal: "bg-red-500/10 text-red-400 border-red-500/20",
  laboral: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  familia: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  mercantil: "bg-green-500/10 text-green-400 border-green-500/20",
  contencioso: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  constitucional: "bg-[#c8a45c]/10 text-[#c8a45c] border-[#c8a45c]/20",
};

const statusLabels: Record<string, string> = {
  activo: "Activo",
  archivado: "Archivado",
  cerrado: "Cerrado",
  suspendido: "Suspendido",
};

const statusColors: Record<string, string> = {
  activo: "bg-green-500/10 text-green-400 border-green-500/20",
  archivado: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  cerrado: "bg-red-500/10 text-red-400 border-red-500/20",
  suspendido: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const priorityLabels: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const priorityColors: Record<string, string> = {
  urgente: "bg-red-500/10 text-red-400 border-red-500/20",
  alta: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  media: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  baja: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

const mockCases: CaseData[] = [
  {
    id: "1",
    firmId: "",
    number: "CV-2026-0042",
    courtNumber: "J-001-2026",
    title: "Pérez vs. Constructora S.A.",
    description: "Demanda por incumplimiento de contrato",
    matter: "civil",
    status: "activo",
    priority: "alta",
    assignedLawyerId: null,
    assignedLawyer: { id: "1", name: "Dr. Ricardo Mendoza" },
    startDate: "2026-01-15",
    endDate: null,
    estimatedValue: "250000",
    metadata: null,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "2",
    firmId: "",
    number: "PE-2026-0018",
    courtNumber: "JP-045-2026",
    title: "Defensa penal — Caso 0452-B",
    description: "Defensa en proceso penal por estafa",
    matter: "penal",
    status: "activo",
    priority: "urgente",
    assignedLawyerId: null,
    assignedLawyer: { id: "2", name: "Dra. Ana Lucía Torres" },
    startDate: "2026-02-20",
    endDate: null,
    estimatedValue: null,
    metadata: null,
    createdAt: "2026-02-20T00:00:00Z",
    updatedAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "3",
    firmId: "",
    number: "FA-2026-0031",
    courtNumber: "J-FAM-012-2026",
    title: "Divorcio Martínez-López",
    description: "Divorcio voluntario con liquidación",
    matter: "familia",
    status: "activo",
    priority: "media",
    assignedLawyerId: null,
    assignedLawyer: { id: "1", name: "Dr. Ricardo Mendoza" },
    startDate: "2026-03-01",
    endDate: null,
    estimatedValue: "50000",
    metadata: null,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-01T00:00:00Z",
  },
  {
    id: "4",
    firmId: "",
    number: "CO-2025-0089",
    courtNumber: "J-CA-089-2025",
    title: "Recurso de amparo fiscal",
    description: "Recurso contra resolución del SAR",
    matter: "contencioso",
    status: "activo",
    priority: "alta",
    assignedLawyerId: null,
    assignedLawyer: { id: "3", name: "Dr. Carlos Sandoval" },
    startDate: "2025-11-10",
    endDate: null,
    estimatedValue: "500000",
    metadata: null,
    createdAt: "2025-11-10T00:00:00Z",
    updatedAt: "2025-11-10T00:00:00Z",
  },
  {
    id: "5",
    firmId: "",
    number: "LA-2026-0005",
    courtNumber: "J-T-005-2026",
    title: "Despido injustificado — García",
    description: "Reclamo por despido sin causa justa",
    matter: "laboral",
    status: "archivado",
    priority: "baja",
    assignedLawyerId: null,
    assignedLawyer: { id: "2", name: "Dra. Ana Lucía Torres" },
    startDate: "2026-01-05",
    endDate: "2026-04-20",
    estimatedValue: "120000",
    metadata: null,
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-04-20T00:00:00Z",
  },
];

export function CasesClient() {
  const [search, setSearch] = useState("");
  const [matter, setMatter] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCases({ search, matter, status, page });

  const cases = data?.data ?? mockCases;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8d91]" />
            <Input
              placeholder="Buscar casos por número o título..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Link href="/casos/nuevo">
              <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#c8a45c] px-3 text-sm font-medium text-[#080b12] hover:bg-[#d4b36a] transition-colors">
                <Plus className="h-4 w-4" />
                Nuevo caso
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c8a45c] border-t-transparent" />
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Briefcase className="mb-4 h-12 w-12 text-[#8b8d91]" />
            <p className="text-sm text-[#8b8d91]">No se encontraron casos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Materia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Abogado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Fecha inicio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8b8d91] uppercase tracking-wider">
                    Prioridad
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {cases.map((caso) => (
                  <tr
                    key={caso.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/casos/${caso.id}`}
                        className="text-sm font-mono text-[#c8a45c] hover:text-[#d4b36a] transition-colors"
                      >
                        {caso.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/casos/${caso.id}`}
                        className="text-sm text-[#e8e4dd] hover:text-[#c8a45c] transition-colors"
                      >
                        {caso.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={matterLabels[caso.matter] ?? caso.matter}
                        className={matterColors[caso.matter] ?? ""}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={statusLabels[caso.status] ?? caso.status}
                        className={statusColors[caso.status] ?? ""}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#8b8d91]">
                        {caso.assignedLawyer?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#8b8d91]">
                        {formatDate(caso.startDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={priorityLabels[caso.priority] ?? caso.priority}
                        className={priorityColors[caso.priority] ?? ""}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-3">
            <span className="text-xs text-[#8b8d91]">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-7 items-center rounded px-2.5 text-xs text-[#8b8d91] hover:text-[#e8e4dd] hover:bg-white/[0.04] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-7 items-center rounded px-2.5 text-xs text-[#8b8d91] hover:text-[#e8e4dd] hover:bg-white/[0.04] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
