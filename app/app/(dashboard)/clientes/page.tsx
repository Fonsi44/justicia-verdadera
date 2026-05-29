"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, Mail, Phone, User, Building } from "lucide-react";
import { useContacts } from "@/hooks/use-contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const typeLabels: Record<string, string> = {
  persona_natural: "Persona Natural",
  persona_juridica: "Persona Jurídica",
  institucion: "Institución",
};

const typeBadge: Record<string, string> = {
  persona_natural:
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  persona_juridica:
    "bg-purple-500/10 text-purple-400 border-purple-500/20",
  institucion:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useContacts({ search, type: typeFilter, page, limit: 18 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">
            Clientes y Contactos
          </h1>
          <p className="mt-1 text-sm text-[#8b8d91]">
            Gestiona tus clientes, contactos y contrapartes
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo contacto
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8d91]" />
          <Input
            placeholder="Buscar por nombre, email o identidad..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="flex h-8 w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          <option value="">Todos los tipos</option>
          <option value="persona_natural">Persona Natural</option>
          <option value="persona_juridica">Persona Jurídica</option>
          <option value="institucion">Institución</option>
        </select>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card h-40 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.length === 0 ? (
            <div className="col-span-full glass-card p-12 text-center">
              <Users className="h-12 w-12 text-[#8b8d91] mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold text-[#e8e4dd] mb-2">
                No hay contactos
              </h3>
              <p className="text-sm text-[#8b8d91] mb-6">
                {search || typeFilter
                  ? "No se encontraron contactos con los filtros actuales."
                  : "Comienza agregando tu primer contacto."}
              </p>
              {!search && !typeFilter && (
                <Link href="/clientes/nuevo">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo contacto
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            data.data.map((contact, i) => {
              const name =
                contact.type === "persona_natural"
                  ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || "Sin nombre"
                  : contact.companyName || "Sin nombre";

              return (
                <Link
                  key={contact.id}
                  href={`/clientes/${contact.id}`}
                  className="glass-card glass-card-hover p-5 group animate-fade-in-up"
                  style={{ animationDelay: `${(i % 6) * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c8a45c]/10 bg-[#c8a45c]/5">
                      {contact.type === "persona_natural" ? (
                        <User className="h-4 w-4 text-[#c8a45c]" />
                      ) : (
                        <Building className="h-4 w-4 text-[#c8a45c]" />
                      )}
                    </div>
                    <Badge className={typeBadge[contact.type] ?? ""}>
                      {typeLabels[contact.type] ?? contact.type}
                    </Badge>
                  </div>
                  <h3 className="font-display text-base font-semibold text-[#e8e4dd] group-hover:text-[#c8a45c] transition-colors duration-200 mb-2 truncate">
                    {name}
                  </h3>
                  <div className="space-y-1.5">
                    {contact.email && (
                      <p className="flex items-center gap-2 text-xs text-[#8b8d91]">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </p>
                    )}
                    {contact.phone && (
                      <p className="flex items-center gap-2 text-xs text-[#8b8d91]">
                        <Phone className="h-3 w-3 shrink-0" />
                        {contact.phone}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-xs text-[#8b8d91]">
                      {contact.caseCount} {contact.caseCount === 1 ? "caso" : "casos"}
                    </span>
                    <span className="text-xs text-[#c8a45c] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Ver perfil &rarr;
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-[#8b8d91]">
            P&aacute;gina {page} de {Math.ceil(data.total / data.limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(data.total / data.limit)}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
