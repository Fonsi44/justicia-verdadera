"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Clock,
  Scale,
  Gavel,
} from "lucide-react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useCase } from "@/hooks/use-cases";
import type { CaseData } from "@/types";

const matterLabels: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  mercantil: "Mercantil",
  contencioso: "Contencioso",
  constitucional: "Constitucional",
};

const matterColors: Record<string, string> = {
  civil: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  penal: "bg-red-500/10 text-red-400 border-red-500/20",
  laboral: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  familia: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  mercantil: "bg-green-500/10 text-green-400 border-green-500/20",
  contencioso: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  constitucional: "bg-[#c8a45c]/10 text-[#c8a45c] border-[#c8a45c]/20",
};

const statusLabels: Record<string, string> = {
  activo: "Activo",
  archivado: "Archivado",
  cerrado: "Cerrado",
  suspendido: "Suspendido",
};

const statusColors: Record<string, string> = {
  activo: "bg-green-500/10 text-green-400 border-green-500/20",
  archivado: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  cerrado: "bg-red-500/10 text-red-400 border-red-500/20",
  suspendido: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

const priorityLabels: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const priorityColors: Record<string, string> = {
  urgente: "bg-red-500/10 text-red-400 border-red-500/20",
  alta: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  media: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  baja: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const partyRoleLabels: Record<string, string> = {
  cliente: "Cliente",
  contraria: "Parte contraria",
  testigo: "Testigo",
  perito: "Perito",
  juez: "Juez",
  fiscal: "Fiscal",
  otro: "Otro",
};

const mockCaseDetail: CaseData = {
  id: "1",
  firmId: "",
  number: "CV-2026-0042",
  courtNumber: "J-001-2026",
  title: "Pérez vs. Constructora S.A.",
  description:
    "Demanda por incumplimiento de contrato de construcción. El demandante alega que la constructora no completó la obra dentro del plazo acordado y que los materiales utilizados no cumplen con las especificaciones técnicas pactadas.",
  matter: "civil",
  status: "activo",
  priority: "alta",
  assignedLawyerId: null,
  assignedLawyer: { id: "1", name: "Dr. Ricardo Mendoza" },
  startDate: "2026-01-15",
  endDate: null,
  estimatedValue: "250000",
  metadata: null,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-05-28T00:00:00Z",
};

const mockParties = [
  {
    id: "p1",
    caseId: "1",
    contactId: "c1",
    role: "cliente" as const,
    isMain: true,
    notes: null,
    contact: {
      id: "c1",
      firmId: "",
      type: "persona_natural" as const,
      firstName: "Juan Carlos",
      lastName: "Pérez",
      companyName: null,
      identityNumber: "0801-1990-12345",
      email: "jperez@email.com",
      phone: "+504 9999-0000",
      address: null,
      notes: null,
      createdAt: "",
      updatedAt: "",
    },
  },
  {
    id: "p2",
    caseId: "1",
    contactId: "c2",
    role: "contraria" as const,
    isMain: false,
    notes: null,
    contact: {
      id: "c2",
      firmId: "",
      type: "persona_juridica" as const,
      firstName: null,
      lastName: null,
      companyName: "Constructora S.A.",
      identityNumber: "08019000000000",
      email: "info@constructora.hn",
      phone: "+504 2222-3333",
      address: null,
      notes: null,
      createdAt: "",
      updatedAt: "",
    },
  },
];

const mockEvents = [
  {
    id: "e1",
    title: "Presentación de demanda",
    description: "Demanda presentada ante el Juzgado Primero",
    type: "notificacion",
    date: "2026-01-15T09:00:00Z",
    isCompleted: true,
  },
  {
    id: "e2",
    title: "Audiencia conciliatoria",
    description: "Audiencia programada para intentar conciliación",
    type: "audiencia",
    date: "2026-06-15T10:00:00Z",
    isCompleted: false,
    location: "Juzgado Primero, Sala 3",
  },
  {
    id: "e3",
    title: "Vencimiento de plazo probatorio",
    description: "Fecha límite para presentar pruebas",
    type: "plazo",
    date: "2026-07-30T23:59:00Z",
    isCompleted: false,
  },
];

const mockDocuments = [
  {
    id: "d1",
    name: "Demanda.pdf",
    type: "demanda",
    status: "final",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "d2",
    name: "Poder_Especial.pdf",
    type: "poder",
    status: "final",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "d3",
    name: "Contrato_Construccion.pdf",
    type: "prueba",
    status: "final",
    createdAt: "2026-01-16T00:00:00Z",
  },
];

const documentTypeLabels: Record<string, string> = {
  demanda: "Demanda",
  contestacion: "Contestación",
  recurso: "Recurso",
  sentencia: "Sentencia",
  contrato: "Contrato",
  poder: "Poder",
  prueba: "Prueba",
  informe: "Informe",
  otro: "Otro",
};

const documentStatusLabels: Record<string, string> = {
  borrador: "Borrador",
  final: "Final",
  firmado: "Firmado",
  archivado: "Archivado",
};

const eventTypeIcons: Record<string, React.ElementType> = {
  vista: Gavel,
  audiencia: Scale,
  plazo: Clock,
  sentencia: Gavel,
  resolucion: FileText,
  notificacion: Calendar,
  otro: Calendar,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
      <span className="text-sm text-[#8b8d91]">{label}</span>
      <span className="text-sm text-[#e8e4dd]">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass-card p-6 ${className ?? ""}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-[#c8a45c]" />}
        <h2 className="font-display text-base font-semibold text-[#e8e4dd]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function CaseDetailSkeleton() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c8a45c] border-t-transparent" />
    </div>
  );
}

export function CaseDetailClient() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { data: caseData, isLoading } = useCase(id);

  const caso: CaseData | null = caseData ?? null;
  const parties = ("parties" in (caso ?? {}) ? (caso as unknown as Record<string, unknown>).parties : null) as typeof mockParties ?? mockParties;
  const displayCase = caso ?? mockCaseDetail;

  if (isLoading) return <CaseDetailSkeleton />;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/casos"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-[#8b8d91] hover:text-[#e8e4dd] hover:bg-white/[0.04] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">
                {displayCase.title}
              </h1>
              <Badge
                label={statusLabels[displayCase.status] ?? displayCase.status}
                className={statusColors[displayCase.status] ?? ""}
              />
            </div>
            <p className="mt-1 text-sm text-[#8b8d91]">
              {displayCase.number}
              {displayCase.courtNumber && (
                <> &middot; {displayCase.courtNumber}</>
              )}
            </p>
          </div>
        </div>
        <Link href={`/casos/${id}/editar`}>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-[#e8e4dd] hover:bg-white/[0.06] transition-colors">
            <Edit3 className="h-4 w-4" />
            Editar
          </button>
        </Link>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SectionCard title="Materia" icon={Scale}>
          <Badge
            label={matterLabels[displayCase.matter] ?? displayCase.matter}
            className={matterColors[displayCase.matter] ?? ""}
          />
        </SectionCard>
        <SectionCard title="Prioridad" icon={Clock}>
          <Badge
            label={
              priorityLabels[displayCase.priority] ?? displayCase.priority
            }
            className={priorityColors[displayCase.priority] ?? ""}
          />
        </SectionCard>
        <SectionCard title="Abogado asignado" icon={Users}>
          <p className="text-sm text-[#e8e4dd]">
            {displayCase.assignedLawyer?.name ?? "No asignado"}
          </p>
        </SectionCard>
        <SectionCard title="Valor estimado" icon={DollarSign}>
          <p className="text-sm text-[#e8e4dd]">
            {displayCase.estimatedValue
              ? `HNL ${Number(displayCase.estimatedValue).toLocaleString("es-HN")}`
              : "No especificado"}
          </p>
        </SectionCard>
      </div>

      {/* Description */}
      {displayCase.description && (
        <SectionCard title="Descripción">
          <p className="text-sm text-[#8b8d91] leading-relaxed">
            {displayCase.description}
          </p>
        </SectionCard>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="parties">
            <Users className="h-4 w-4" />
            Partes
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="finances">
            <DollarSign className="h-4 w-4" />
            Finanzas
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <div className="space-y-4">
            {mockEvents.length === 0 ? (
              <SectionCard title="Cronograma">
                <p className="text-sm text-[#8b8d91]">
                  No hay eventos registrados
                </p>
              </SectionCard>
            ) : (
              mockEvents.map((event) => {
                const Icon =
                  eventTypeIcons[event.type as keyof typeof eventTypeIcons] ??
                  Calendar;
                return (
                  <div key={event.id} className="glass-card p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                          event.isCompleted
                            ? "border-green-500/20 bg-green-500/10 text-green-400"
                            : "border-[#c8a45c]/10 bg-[#c8a45c]/5 text-[#c8a45c]"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[#e8e4dd]">
                            {event.title}
                          </h3>
                          {event.isCompleted ? (
                            <span className="text-xs text-green-400">
                              Completado
                            </span>
                          ) : (
                            <span className="text-xs text-[#c8a45c]">
                              Pendiente
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="mt-1 text-xs text-[#8b8d91]">
                            {event.description}
                          </p>
                        )}
                        <p className="mt-1.5 text-xs text-[#8b8d91]">
                          {formatDateTime(event.date)}
                          {event.location && <> &middot; {event.location}</>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Parties Tab */}
        <TabsContent value="parties">
          <SectionCard title="Partes del caso">
            {parties.length === 0 ? (
              <p className="text-sm text-[#8b8d91]">
                No hay partes registradas
              </p>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {parties.map((party: (typeof mockParties)[number]) => (
                  <div
                    key={party.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8a45c]/5 border border-[#c8a45c]/10">
                        <Users className="h-4 w-4 text-[#c8a45c]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#e8e4dd]">
                          {party.contact?.firstName && party.contact?.lastName
                            ? `${party.contact.firstName} ${party.contact.lastName}`
                            : party.contact?.companyName ?? "Sin nombre"}
                        </p>
                        <p className="text-xs text-[#8b8d91]">
                          {partyRoleLabels[party.role as keyof typeof partyRoleLabels] ?? party.role}
                          {party.isMain && " (Principal)"}
                        </p>
                      </div>
                    </div>
                    {party.contact?.email && (
                      <span className="text-xs text-[#8b8d91]">
                        {party.contact.email}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <SectionCard title="Documentos">
            {mockDocuments.length === 0 ? (
              <p className="text-sm text-[#8b8d91]">
                No hay documentos vinculados
              </p>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                        <FileText className="h-4 w-4 text-[#7ea8c4]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#e8e4dd]">{doc.name}</p>
                        <p className="text-xs text-[#8b8d91]">
                          {documentTypeLabels[doc.type as keyof typeof documentTypeLabels] ?? doc.type}
                          {" · "}
                          {documentStatusLabels[doc.status as keyof typeof documentStatusLabels] ?? doc.status}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#8b8d91]">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Finances Tab */}
        <TabsContent value="finances">
          <SectionCard title="Resumen financiero">
            <div className="space-y-3">
              <DetailRow label="Valor estimado" value={
                displayCase.estimatedValue
                  ? `HNL ${Number(displayCase.estimatedValue).toLocaleString("es-HN")}`
                  : "No especificado"
              } />
              <DetailRow label="Horas registradas" value="0h" />
              <DetailRow label="Facturas emitidas" value="0" />
              <DetailRow label="Total facturado" value="HNL 0.00" />
              <DetailRow label="Total cobrado" value="HNL 0.00" />
              <DetailRow label="Saldo pendiente" value="HNL 0.00" />
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}
