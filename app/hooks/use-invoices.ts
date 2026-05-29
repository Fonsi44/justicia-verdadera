"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

interface InvoiceData {
  id: string;
  number: string;
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  clientId: string;
  caseId: string | null;
  createdAt: string;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  } | null;
  items?: InvoiceItem[];
}

interface InvoicesResponse {
  data: InvoiceData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pendingAmount: string;
}

interface InvoiceFilters {
  status?: string;
  clientId?: string;
  caseId?: string;
  page?: number;
  limit?: number;
}

function buildUrl(filters: InvoiceFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.clientId) params.set("clientId", filters.clientId);
  if (filters.caseId) params.set("caseId", filters.caseId);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return `/api/invoices${qs ? `?${qs}` : ""}`;
}

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery<InvoicesResponse>({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      const res = await fetch(buildUrl(filters));
      if (!res.ok) throw new Error("Error al cargar facturas");
      return res.json();
    },
  });
}

export function useInvoice(id: string) {
  return useQuery<{ data: InvoiceData }>({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Error al cargar la factura");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      caseId?: string;
      clientId: string;
      number: string;
      issueDate: string;
      dueDate: string;
      notes?: string;
      items?: { description: string; quantity: number; unitPrice: number }[];
    }) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear factura");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<InvoiceData>) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar factura");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
    },
  });
}

export function useDeleteInvoice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al eliminar factura");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
