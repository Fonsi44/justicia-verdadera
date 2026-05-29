"use client";

import { useEffect, useState } from "react";
import { Receipt, Plus, ChevronDown, AlertTriangle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: string;
  issueDate: string;
  dueDate: string;
  client: { id: string; firstName: string | null; lastName: string | null; companyName: string | null } | null;
}

const statusColors: Record<string, string> = {
  borrador: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  emitida: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pagada: "bg-green-500/10 text-green-400 border-green-500/20",
  anulada: "bg-red-500/10 text-red-400 border-red-500/20",
  vencida: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
  vencida: "Vencida",
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">Facturación</h1>
        <p className="mt-1 text-sm text-[#8b8d91]">Gestiona facturas, pagos y cuentas por cobrar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-xs text-[#8b8d91] mb-2">Total pendiente</p>
          <p className="font-display text-2xl font-bold text-[#e8e4dd]">
            {formatCurrency(parseFloat(pendingAmount))}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-[#8b8d91] mb-2">Facturas emitidas</p>
          <p className="font-display text-2xl font-bold text-[#e8e4dd]">
            {invoices.filter((i) => i.status === "emitida" || i.status === "vencida").length}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-[#8b8d91] mb-2">Facturas pagadas</p>
          <p className="font-display text-2xl font-bold text-[#e8e4dd]">
            {invoices.filter((i) => i.status === "pagada").length}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-white/[0.06] bg-[#0d1119] py-2.5 pl-4 pr-10 text-sm text-[#e8e4dd] focus:outline-none focus:border-[#c8a45c]/40"
          >
            <option value="">Todos los estados</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8d91] pointer-events-none" />
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#c8a45c] px-5 py-2.5 text-sm font-medium text-[#080b12] hover:bg-[#d4b36a] transition-colors">
          <Plus className="h-4 w-4" />
          Nueva factura
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#8b8d91]">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="h-10 w-10 text-[#8b8d91] mx-auto mb-3" />
            <p className="text-sm text-[#8b8d91]">No hay facturas registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Número</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Cliente</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Estado</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Emisión</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#c8a45c]/5 border border-[#c8a45c]/10">
                        <Receipt className="h-3.5 w-3.5 text-[#c8a45c]" />
                      </div>
                      <span className="text-sm text-[#e8e4dd] font-medium">{inv.number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#e8e4dd]">
                    {inv.client
                      ?                       (inv.client.companyName ?? (`${inv.client.firstName ?? ""} ${inv.client.lastName ?? ""}`.trim() || "—"))
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[inv.status]}`}>
                      {inv.status === "vencida" && <AlertTriangle className="h-3 w-3" />}
                      {statusLabels[inv.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-[#e8e4dd]">
                    {formatCurrency(parseFloat(inv.total))}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8b8d91]">{formatDate(inv.issueDate)}</td>
                  <td className="px-6 py-4 text-sm text-[#8b8d91]">{formatDate(inv.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
