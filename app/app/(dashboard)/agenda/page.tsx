"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Calendar, MapPin, CheckCircle2, Circle, Plus, ChevronDown } from "lucide-react";
import { useEvents, useUpdateEvent } from "@/hooks/use-events";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

const typeColors: Record<string, string> = {
  vista: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  audiencia: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  plazo: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  sentencia: "bg-green-500/10 text-green-400 border-green-500/20",
  resolucion: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  notificacion: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  otro: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const typeLabels: Record<string, string> = {
  vista: "Vista",
  audiencia: "Audiencia",
  plazo: "Plazo",
  sentencia: "Sentencia",
  resolucion: "Resolución",
  notificacion: "Notificación",
  otro: "Otro",
};

export default function AgendaPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState("upcoming");

  const {
    data: eventsData,
    isLoading: loading,
    refetch,
  } = useEvents({
    type: typeFilter || undefined,
    upcoming: dateRange === "upcoming" ? true : undefined,
  });

  const events = eventsData?.data ?? [];
  const updateEvent = useUpdateEvent("");

  const toggleComplete = useCallback(
    async (event: { id: string; isCompleted: boolean }) => {
      updateEvent.mutate(
        { isCompleted: !event.isCompleted } as Record<string, unknown>,
        { onSuccess: () => { void refetch(); } }
      );
    },
    [updateEvent, refetch]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">Agenda y Calendario</h1>
        <p className="mt-1 text-sm text-[#8b8d91]">Gestiona vistas, audiencias, plazos y eventos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.06] bg-[#0d1119] py-2.5 pl-4 pr-10 text-sm text-[#e8e4dd] focus:outline-none focus:border-[#c8a45c]/40"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8d91] pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.06] bg-[#0d1119] py-2.5 pl-4 pr-10 text-sm text-[#e8e4dd] focus:outline-none focus:border-[#c8a45c]/40"
            >
              <option value="upcoming">Próximos</option>
              <option value="all">Todos</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8d91] pointer-events-none" />
          </div>
        </div>
        <Link
          href="/agenda/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#c8a45c] px-5 py-2.5 text-sm font-medium text-[#080b12] hover:bg-[#d4b36a] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Link>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-8 text-center text-sm text-[#8b8d91]">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Calendar className="h-10 w-10 text-[#8b8d91] mx-auto mb-3" />
            <p className="text-sm text-[#8b8d91]">No hay eventos programados</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`glass-card p-5 flex items-start gap-4 transition-all ${
                event.isCompleted ? "opacity-50" : ""
              }`}
            >
              <button
                onClick={() => toggleComplete(event)}
                className="mt-0.5 flex-shrink-0 text-[#8b8d91] hover:text-[#c8a45c] transition-colors"
              >
                {event.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-[#8b9d83]" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${typeColors[event.type] ?? typeColors.otro}`}>
                    {typeLabels[event.type] ?? event.type}
                  </span>
                  {event.case && (
                    <Link href={`/casos/${event.case.id}`} className="text-xs text-[#c8a45c] hover:text-[#d4b36a] transition-colors">
                      {event.case.number}
                    </Link>
                  )}
                </div>
                <h3 className={`font-display text-base font-semibold text-[#e8e4dd] ${event.isCompleted ? "line-through" : ""}`}>
                  {event.title}
                </h3>
                {event.description && (
                  <p className="mt-1 text-sm text-[#8b8d91]">{event.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#8b8d91]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(event.date)}
                    {event.endDate && ` — ${formatDateTime(event.endDate)}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
