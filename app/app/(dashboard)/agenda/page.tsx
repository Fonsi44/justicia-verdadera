"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Filter,
} from "lucide-react";
import { useEvents } from "@/hooks/use-events";
import { formatDateTime } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import LoadingSkeleton from "@/components/loading-skeleton";
import EmptyState from "@/components/empty-state";

const typeColors: Record<string, string> = {
  vista: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  audiencia: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  plazo: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  sentencia: "bg-green-500/10 text-green-700 border-green-500/20",
  resolucion: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20",
  notificacion: "bg-pink-500/10 text-pink-700 border-pink-500/20",
  otro: "bg-gray-500/10 text-gray-600 border-gray-500/20",
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

const typeIcons: Record<string, string> = {
  vista: "\u{1F3DB}\u{FE0F}",
  audiencia: "\u{1F468}\u200D\u2696\uFE0F",
  plazo: "\u23F3",
  sentencia: "\u{1F4DC}",
  resolucion: "\u{1F4CB}",
  notificacion: "\u2709\uFE0F",
  otro: "\u{1F4CC}",
};

function CountdownBadge({ date }: { date: string }) {
  const [now] = useState(() => Date.now());
  const target = new Date(date).getTime();
  const diffDays = Math.ceil((target - now) / 86400000);

  if (diffDays < 0) {
    return (
      <span className="text-xs text-muted-foreground">Pasado</span>
    );
  }
  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700">
        Hoy
      </span>
    );
  }
  if (diffDays <= 2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700">
        {diffDays}d
      </span>
    );
  }
  if (diffDays <= 7) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
        {diffDays}d
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">{diffDays}d</span>
  );
}

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

  const toggleComplete = useCallback(
    async (event: { id: string; isCompleted: boolean }) => {
      try {
        const res = await fetch(`/api/events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted: !event.isCompleted }),
        });
        if (res.ok) void refetch();
      } catch (e) {
        console.error("Error updating event:", e);
      }
    },
    [refetch],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda y Calendario"
        description="Gestiona vistas, audiencias, plazos y eventos"
        actions={
          <Link
            href="/agenda/nuevo"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-xl border bg-background py-2.5 pl-9 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {typeIcons[value]} {label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none rounded-xl border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="upcoming">Pr&oacute;ximos</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <LoadingSkeleton variant="list" />
        ) : events.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 ring-1 ring-foreground/10">
            <EmptyState
              icon={Calendar}
              title={
                typeFilter || dateRange !== "upcoming"
                  ? "Sin resultados"
                  : "No hay eventos programados"
              }
              description={
                typeFilter || dateRange !== "upcoming"
                  ? "No se encontraron eventos con los filtros actuales."
                  : "Programa tu primer evento para empezar a gestionar tu calendario."
              }
            />
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={event.id}
              className={`flex items-start gap-4 rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-all duration-300 group hover:ring-2 hover:ring-primary/20 animate-fade-in-up ${
                event.isCompleted ? "opacity-50" : ""
              }`}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <button
                onClick={() => toggleComplete(event)}
                className="mt-0.5 flex-shrink-0 text-muted-foreground transition-colors hover:text-primary"
                aria-label={event.isCompleted ? "Marcar como pendiente" : "Marcar como completado"}
              >
                {event.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 transition-colors group-hover:text-primary" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      typeColors[event.type] ?? typeColors.otro
                    }`}
                  >
                    {typeLabels[event.type] ?? event.type}
                  </span>
                  {event.case && (
                    <Link
                      href={`/casos/${event.case.id}`}
                      className="font-mono text-xs text-primary transition-colors hover:text-primary/80"
                    >
                      {event.case.number}
                    </Link>
                  )}
                </div>
                <h3
                  className={`font-display text-base font-semibold text-foreground ${
                    event.isCompleted ? "line-through" : ""
                  }`}
                >
                  {event.title}
                </h3>
                {event.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {event.description}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(event.date)}
                    {event.endDate &&
                      ` \u2014 ${formatDateTime(event.endDate)}`}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <CountdownBadge date={event.date} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
