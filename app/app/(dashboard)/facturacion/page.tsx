"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import LoadingSkeleton from "@/components/loading-skeleton";
import EmptyState from "@/components/empty-state";
import StatusBadge from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: string;
  issueDate: string;
  dueDate: string;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
  vencida: "Vencida",
};

const statusVariantMap: Record<string, string> = {
  borrador: "neutral",
  emitida: "info",
  pagada: "success",
  anulada: "danger",
  vencida: "danger",
};

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingAmount, setPendingAmount] = useState("0");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/invoices?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        setInvoices(res.data ?? []);
        setPendingAmount(res.pendingAmount ?? "0");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const emitidas = invoices.filter(
    (i) => i.status === "emitida" || i.status === "vencida",
  ).length;
  const pagadas = invoices.filter((i) => i.status === "pagada").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturaci&oacute;n"
        description="Gestiona facturas, pagos y cuentas por cobrar"
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            Nueva factura
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total pendiente"
          value={formatCurrency(parseFloat(pendingAmount))}
          icon={Receipt}
          variant="warning"
          loading={loading}
        />
        <StatCard
          label="Facturas emitidas"
          value={emitidas}
          icon={TrendingUp}
          variant="primary"
          loading={loading}
        />
        <StatCard
          label="Facturas pagadas"
          value={pagadas}
          icon={CheckCircle}
          variant="success"
          loading={loading}
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="appearance-none rounded-xl border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">Todos los estados</option>
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="overflow-hidden rounded-xl border bg-card ring-1 ring-foreground/10">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton variant="table" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState
              icon={Receipt}
              title={
                statusFilter
                  ? "Sin resultados"
                  : "No hay facturas registradas"
              }
              description={
                statusFilter
                  ? "No se encontraron facturas con el filtro actual."
                  : "Crea tu primera factura para empezar a gestionar tu facturaci\u00f3n."
              }
            />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  N&uacute;mero
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Emisi&oacute;n
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vencimiento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv, i) => (
                <tr
                  key={inv.id}
                  className="transition-colors hover:bg-muted/50 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <Receipt className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-mono text-sm font-medium text-foreground">
                        {inv.number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {inv.client
                      ? ((inv.client.companyName ??
                            `${inv.client.firstName ?? ""} ${
                              inv.client.lastName ?? ""
                            }`.trim()) || "\u2014")
                      : "\u2014"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      status={statusLabels[inv.status] ?? inv.status}
                      variant={
                        (statusVariantMap[inv.status] as
                          | "default"
                          | "success"
                          | "warning"
                          | "danger"
                          | "info"
                          | "neutral") ?? "neutral"
                      }
                      size="sm"
                      dot
                    />
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(parseFloat(inv.total))}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(inv.dueDate)}
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
