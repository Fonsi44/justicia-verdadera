"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import SearchAndFilters from "@/components/search-and-filters";
import LoadingSkeleton from "@/components/loading-skeleton";
import EmptyState from "@/components/empty-state";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UploadDocument from "@/components/upload-document";

interface Document {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  case: { id: string; number: string; title: string } | null;
}

const typeLabels: Record<string, string> = {
  demanda: "Demanda",
  contestacion: "Contestación",
  recurso: "Recurso",
  sentencia: "Sentencia",
  contrato: "Contrato",
  poder: "Poder",
  prueba: "Prueba",
  informe: "Informe",
  otro: "Otro",
};

const typeVariants: Record<string, string> = {
  demanda: "info",
  contestacion: "warning",
  recurso: "danger",
  sentencia: "success",
  contrato: "default",
  poder: "default",
  prueba: "warning",
  informe: "default",
  otro: "default",
};

const typeFilterChips = Object.entries(typeLabels).map(([value, label]) => ({
  label,
  value,
}));

const statusVariantMap: Record<string, string> = {
  borrador: "neutral",
  final: "success",
  firmado: "info",
  archivado: "neutral",
};

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  final: "Final",
  firmado: "Firmado",
  archivado: "Archivado",
};

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/documents?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => setDocuments(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Gestiona todos los documentos de tu despacho"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Upload className="h-4 w-4" />Subir documento</Button>} />
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Subir documento</DialogTitle>
              </DialogHeader>
              <UploadDocument onSuccess={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      <SearchAndFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar documentos..."
        filters={typeFilterChips}
        activeFilter={typeFilter || "all"}
        onFilterChange={(v) => setTypeFilter(v === "all" ? "" : v)}
        loading={loading}
      />

      <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" />
          </div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState
              icon={FileText}
              title={
                search || typeFilter
                  ? "Sin resultados"
                  : "No hay documentos registrados"
              }
              description={
                search || typeFilter
                  ? "No se encontraron documentos con los filtros actuales."
                  : "Sube tu primer documento para empezar a gestionar tus archivos."
              }
            />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Caso vinculado
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Versión
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((doc, i) => (
                <tr
                  key={doc.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {doc.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={typeLabels[doc.type] ?? doc.type}
                      variant={
                        (typeVariants[doc.type] as
                          | "default"
                          | "success"
                          | "warning"
                          | "danger"
                          | "info"
                          | "neutral") ?? "default"
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={statusLabels[doc.status] ?? doc.status}
                      variant={
                        (statusVariantMap[doc.status] as
                          | "default"
                          | "success"
                          | "warning"
                          | "danger"
                          | "info"
                          | "neutral") ?? "neutral"
                      }
                      size="sm"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {doc.case ? (
                      <span className="font-mono text-xs text-primary">
                        {doc.case.number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      v{doc.currentVersion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
