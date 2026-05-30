"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Mail, Phone, User, Building, Hash } from "lucide-react";
import { useContacts } from "@/hooks/use-contacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/page-header";
import SearchAndFilters from "@/components/search-and-filters";
import EmptyState from "@/components/empty-state";
import LoadingSkeleton from "@/components/loading-skeleton";

const typeLabels: Record<string, string> = {
  persona_natural: "Persona Natural",
  persona_juridica: "Persona Jurídica",
  institucion: "Institución",
};

const typeBadge: Record<string, string> = {
  persona_natural: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  persona_juridica: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  institucion: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const typeFilters = [
  { label: "Persona Natural", value: "persona_natural" },
  { label: "Persona Jurídica", value: "persona_juridica" },
  { label: "Institución", value: "institucion" },
];

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useContacts({ search, type: typeFilter, page, limit: 18 });

  const contacts = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes y Contactos"
        description="Gestiona tus clientes, contactos y contrapartes"
        actions={
          <Link href="/clientes/nuevo">
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo contacto
            </Button>
          </Link>
        }
      />

      <SearchAndFilters
        searchPlaceholder="Buscar por nombre, email o identidad..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        filters={typeFilters}
        activeFilter={typeFilter}
        onFilterChange={(v) => { setTypeFilter(v === "all" ? "" : v); setPage(1); }}
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
      )}

      {!isLoading && contacts.length === 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <EmptyState
            icon={Users}
            title={search || typeFilter ? "Sin resultados" : "No hay contactos"}
            description={
              search || typeFilter
                ? "No se encontraron contactos con los filtros actuales."
                : "Comienza agregando tu primer contacto."
            }
            action={
              !search && !typeFilter
                ? { label: "Nuevo contacto", href: "/clientes/nuevo" }
                : undefined
            }
          />
        </div>
      )}

      {!isLoading && contacts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, i) => {
            const name =
              contact.type === "persona_natural"
                ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || "Sin nombre"
                : contact.companyName || "Sin nombre";

            return (
              <Link
                key={contact.id}
                href={`/clientes/${contact.id}`}
                className="group rounded-xl border bg-card shadow-sm p-5 animate-fade-in-up hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                style={{ animationDelay: `${(i % 6) * 0.08}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 transition-colors group-hover:border-primary/20">
                    {contact.type === "persona_natural" ? (
                      <User className="h-4 w-4 text-primary" />
                    ) : (
                      <Building className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <Badge className={typeBadge[contact.type] ?? ""}>
                    {typeLabels[contact.type] ?? contact.type}
                  </Badge>
                </div>
                <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-200 mb-2 truncate">
                  {name}
                </h3>
                <div className="space-y-1.5">
                  {contact.email && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </p>
                  )}
                  {contact.phone && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      {contact.phone}
                    </p>
                  )}
                  {contact.identityNumber && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3 shrink-0" />
                      {contact.identityNumber}
                    </p>
                  )}
                </div>
                {(contact.caseCount ?? 0) > 0 && (
                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {contact.caseCount} {contact.caseCount === 1 ? "caso" : "casos"}
                    </span>
                    <span className="text-xs text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                      Ver perfil →
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {total > 18 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {Math.ceil(total / 18)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 18)}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
