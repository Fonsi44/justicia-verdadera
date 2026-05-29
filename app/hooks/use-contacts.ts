import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContactData } from "@/types";

interface ContactsResponse {
  data: ContactData[];
  total: number;
  page: number;
  limit: number;
}

interface ContactFilters {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface CreateContactInput {
  type: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  identityNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

type UpdateContactInput = Partial<CreateContactInput>;

export interface RelatedCase {
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  matter: string;
  status: string;
  role: string;
  isMain: boolean;
}

interface ContactDetailResponse {
  data: ContactData;
  relatedCases: RelatedCase[];
}

function buildUrl(filters: ContactFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return `/api/contacts${qs ? `?${qs}` : ""}`;
}

export function useContacts(filters: ContactFilters = {}) {
  return useQuery<ContactsResponse>({
    queryKey: ["contacts", filters],
    queryFn: async () => {
      const res = await fetch(buildUrl(filters));
      if (!res.ok) throw new Error("Error al obtener contactos");
      return res.json();
    },
  });
}

export function useContact(id: string) {
  return useQuery<ContactDetailResponse>({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error("Error al obtener el contacto");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Error al crear el contacto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateContactInput) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Error al actualizar el contacto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
    },
  });
}

export function useDeleteContact(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar el contacto");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
