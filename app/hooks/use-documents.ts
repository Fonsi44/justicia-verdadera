"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  status: string;
  caseId: string | null;
  createdAt: string;
  updatedAt: string;
  case: { id: string; number: string; title: string } | null;
}

interface DocumentsResponse {
  data: DocumentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DocumentFilters {
  search?: string;
  type?: string;
  caseId?: string;
  page?: number;
  limit?: number;
}

function buildUrl(filters: DocumentFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.caseId) params.set("caseId", filters.caseId);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return `/api/documents${qs ? `?${qs}` : ""}`;
}

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery<DocumentsResponse>({
    queryKey: ["documents", filters],
    queryFn: async () => {
      const res = await fetch(buildUrl(filters));
      if (!res.ok) throw new Error("Error al cargar documentos");
      return res.json();
    },
  });
}

export function useDocument(id: string) {
  return useQuery<{ data: DocumentItem }>({
    queryKey: ["document", id],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${id}`);
      if (!res.ok) throw new Error("Error al cargar el documento");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      caseId?: string;
      name: string;
      type: string;
    }) => {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear documento");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocument(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<DocumentItem>) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar documento");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}

export function useDeleteDocument(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al eliminar documento");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
