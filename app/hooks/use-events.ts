"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EventItem {
  id: string;
  caseId: string;
  type: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  isCompleted: boolean;
  case: { id: string; number: string; title: string } | null;
}

interface EventsResponse {
  data: EventItem[];
}

interface EventFilters {
  caseId?: string;
  type?: string;
  from?: string;
  to?: string;
  upcoming?: boolean;
}

function buildUrl(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.caseId) params.set("caseId", filters.caseId);
  if (filters.type) params.set("type", filters.type);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.upcoming) params.set("upcoming", "true");
  const qs = params.toString();
  return `/api/events${qs ? `?${qs}` : ""}`;
}

export function useEvents(filters: EventFilters = {}) {
  return useQuery<EventsResponse>({
    queryKey: ["events", filters],
    queryFn: async () => {
      const res = await fetch(buildUrl(filters));
      if (!res.ok) throw new Error("Error al cargar eventos");
      return res.json();
    },
  });
}

export function useEvent(id: string) {
  return useQuery<{ data: EventItem }>({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error("Error al cargar el evento");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      caseId: string;
      type: string;
      title: string;
      description?: string;
      date: string;
      endDate?: string;
      location?: string;
    }) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear evento");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<EventItem>) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar evento");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
  });
}

export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al eliminar evento");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
