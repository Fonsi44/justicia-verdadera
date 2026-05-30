import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { documents, caseParties, contacts } from "@/database/schema";
import { getSession, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { getCaseById } from "@/lib/services/cases.service";
import { getTemplateById, type LegalTemplate } from "@/lib/ai/templates";
import { callAI } from "@/lib/ai/client";
import { searchSimilarDocuments } from "@/lib/ai/embeddings";
import { eq } from "drizzle-orm";

const generateSchema = z.object({
  caseId: z.string().uuid("caseId debe ser un UUID válido"),
});

function mapTemplateTypeToDocType(templateType: string): string {
  const map: Record<string, string> = {
    demanda: "demanda",
    contestacion: "contestacion",
    recurso: "recurso",
    contrato: "contrato",
    poder: "poder",
    escrito: "otro",
    informe: "informe",
  };
  return map[templateType] ?? "otro";
}

function buildTemplatePrompt(
  template: LegalTemplate,
  caseData: Record<string, unknown>,
  parties: Array<Record<string, unknown>>,
  jurisprudencia: Array<{ title: string; content: string; source: string; similarity: number }>,
): string {
  const partiesText = parties
    .map((p) => `  - Rol: ${p.role} | ${(p as Record<string, unknown>).contact_firstName ? `Nombre: ${p.contact_firstName} ${p.contact_lastName}` : `Empresa: ${p.contact_companyName}`}${p.contact_identityNumber ? ` | RTN/DNI: ${p.contact_identityNumber}` : ""}`)
    .join("\n");

  const jurisprudenciaText = jurisprudencia
    .map((j) => `- ${j.title} (${j.source}): ${j.content.substring(0, 1500)}`)
    .join("\n\n");

  return `${template.basePrompt}

## DATOS DEL CASO
- Número de caso: ${caseData.number}
- Título: ${caseData.title}
- Descripción: ${caseData.description ?? "(sin descripción)"}
- Materia: ${caseData.matter}
- Estado: ${caseData.status}
- Fecha de inicio: ${caseData.startDate}
- Fecha de fin: ${caseData.endDate ?? "(sin definir)"}
- Valor estimado: ${caseData.estimatedValue ?? "(no especificado)"}

## PARTES DEL PROCESO
${partiesText || "(no hay partes registradas)"}

## ESTRUCTURA DEL DOCUMENTO
${template.estructura.map((e, i) => `${i + 1}. ${e}`).join("\n")}

## JURISPRUDENCIA RELEVANTE
${jurisprudenciaText || "(no se encontró jurisprudencia relevante)"}

## INSTRUCCIONES ADICIONALES
1. Genera el documento en español, con lenguaje jurídico formal propio de Honduras.
2. Sigue EXACTAMENTE la estructura indicada.
3. Incorpora los datos reales del caso en los lugares correspondientes.
4. Si hay jurisprudencia disponible, cítala donde sea relevante.
5. No inventes números de artículos ni citas legales que no estén en el contexto.
6. El documento debe estar listo para revisión por un abogado.`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: templateId } = await params;
    const session = await getSession();
    const firmId = session.user.firmId;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join(".")] = issue.message;
      }
      return NextResponse.json(
        { error: "Datos inválidos", code: "VALIDATION_ERROR", fields },
        { status: 400 },
      );
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const caseData = await getCaseById(firmId, parsed.data.caseId);

    const parties = await db
      .select({
        role: caseParties.role,
        isMain: caseParties.isMain,
        contactId: caseParties.contactId,
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactCompanyName: contacts.companyName,
        contactIdentityNumber: contacts.identityNumber,
        contactEmail: contacts.email,
        contactPhone: contacts.phone,
      })
      .from(caseParties)
      .leftJoin(contacts, eq(caseParties.contactId, contacts.id))
      .where(eq(caseParties.caseId, parsed.data.caseId));

    let jurisprudencia: Array<{ title: string; content: string; source: string; similarity: number }> = [];
    try {
      jurisprudencia = await searchSimilarDocuments(
        `${caseData.matter} ${caseData.title} ${caseData.description ?? ""}`,
        5,
      );
    } catch {
      // Embeddings no configurados — continuar sin jurisprudencia
    }

    const prompt = buildTemplatePrompt(template, caseData as Record<string, unknown>, parties as unknown as Array<Record<string, unknown>>, jurisprudencia);

    const aiResult = await callAI(prompt, { temperature: 0.3, maxOutputTokens: 4096 });
    if (!aiResult) {
      return NextResponse.json({ error: "El motor de IA no generó respuesta" }, { status: 500 });
    }

    const docType = mapTemplateTypeToDocType(template.type);

    const [doc] = await db
      .insert(documents)
      .values({
        firmId: firmId as string,
        caseId: parsed.data.caseId,
        name: `${template.name} - ${caseData.number}`,
        type: docType as "demanda" | "contestacion" | "recurso" | "sentencia" | "contrato" | "poder" | "prueba" | "informe" | "otro",
        status: "borrador",
        ocrText: aiResult.text,
        processingStatus: "ocr_complete",
        createdBy: session.user.id as string,
      })
      .returning();

    await writeAuditLog({
      firmId,
      userId: session.user.id,
      action: "create",
      entityType: "document",
      entityId: doc.id,
      changes: { templateId, caseId: parsed.data.caseId, name: doc.name },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json(
      { data: { ...doc, generatedText: aiResult.text } },
      { status: 201 },
    );
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error generating draft:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al generar el borrador" }, { status: 500 });
  }
}
