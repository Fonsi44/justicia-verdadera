import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { contacts, caseParties, cases } from "@/database/schema";
import { getFirmId } from "@/lib/auth/require-auth";
import { eq, and, count, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, MapPin, FileText, Briefcase, Building, User, Hash } from "lucide-react";
import PageHeader from "@/components/page-header";

const typeLabels: Record<string, string> = {
  persona_natural: "Persona Natural",
  persona_juridica: "Persona Jur&iacute;dica",
  institucion: "Instituci&oacute;n",
};

const typeBadge: Record<string, string> = {
  persona_natural: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  persona_juridica: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  institucion: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
};

const matterLabels: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  mercantil: "Mercantil",
  contencioso: "Contencioso",
  constitucional: "Constitucional",
};

const statusBadge: Record<string, string> = {
  activo: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  archivado: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  cerrado: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  suspendido: "bg-red-500/10 text-red-700 border-red-500/20",
};

const roleLabels: Record<string, string> = {
  cliente: "Cliente",
  contraria: "Contraria",
  testigo: "Testigo",
  perito: "Perito",
  juez: "Juez",
  fiscal: "Fiscal",
  otro: "Otro",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const firmId = await getFirmId();

  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.firmId, firmId)))
    .limit(1);

  if (!contact) notFound();

  const [{ value: caseCount }] = await db
    .select({ value: count() })
    .from(caseParties)
    .where(eq(caseParties.contactId, id));

  const relatedCases = await db
    .select({
      caseId: cases.id,
      caseNumber: cases.number,
      caseTitle: cases.title,
      matter: cases.matter,
      status: cases.status,
      role: caseParties.role,
      isMain: caseParties.isMain,
    })
    .from(caseParties)
    .innerJoin(cases, eq(caseParties.caseId, cases.id))
    .where(and(eq(caseParties.contactId, id), eq(cases.firmId, firmId)))
    .orderBy(desc(cases.createdAt));

  const name =
    contact.type === "persona_natural"
      ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || "Sin nombre"
      : contact.companyName || "Sin nombre";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <PageHeader
        title={name}
        breadcrumbs={[
          { label: "Clientes", href: "/clientes" },
          { label: name },
        ]}
        actions={
          <Link href={`/clientes/${id}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        }
      />

      <div className="rounded-xl border bg-card shadow-sm p-6 animate-fade-in-up">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary/5">
            {contact.type === "persona_natural" ? (
              <User className="h-6 w-6 text-primary" />
            ) : (
              <Building className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-foreground truncate">
                {name}
              </h1>
              <Badge className={typeBadge[contact.type] ?? ""}>
                {typeLabels[contact.type] ?? contact.type}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {caseCount} {caseCount === 1 ? "caso asociado" : "casos asociados"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contact.identityNumber && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
              <Hash className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Identidad / RTN</p>
                <p className="text-sm text-foreground truncate">{contact.identityNumber}</p>
              </div>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground truncate">{contact.email}</p>
              </div>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Tel&eacute;fono</p>
                <p className="text-sm text-foreground">{contact.phone}</p>
              </div>
            </div>
          )}
          {contact.address && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Direcci&oacute;n</p>
                <p className="text-sm text-foreground truncate">{contact.address}</p>
              </div>
            </div>
          )}
        </div>

        {contact.notes && (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
            <p className="text-xs text-muted-foreground mb-2">Notas</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Casos relacionados
          </h2>
          <Badge variant="outline">{caseCount} {caseCount === 1 ? "caso" : "casos"}</Badge>
        </div>

        {relatedCases.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Este contacto no est&aacute; asociado a ning&uacute;n caso
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {relatedCases.map((rc) => (
              <Link
                key={rc.caseId}
                href={`/casos/${rc.caseId}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/5 border border-primary/10">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {rc.caseNumber} &mdash; {rc.caseTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {matterLabels[rc.matter] ?? rc.matter} &middot; {roleLabels[rc.role] ?? rc.role}
                    </p>
                  </div>
                </div>
                <Badge className={`${statusBadge[rc.status] ?? ""} shrink-0 ml-2`}>
                  {rc.status.charAt(0).toUpperCase() + rc.status.slice(1)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
