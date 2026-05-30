import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { caseParties, contacts } from "@/database/schema";
import { getSession, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { getTemplateById } from "@/lib/ai/templates";
import { streamAI } from "@/lib/ai/client";
import { searchSimilarDocuments } from "@/lib/ai/embeddings";
import { eq } from "drizzle-orm";

const generateStreamSchema = z.object({
  templateId: z.string().min(1, "templateId es requerido"),
  caseId: z.string().uuid("caseId debe ser un UUID válido").optional(),
  customPrompt: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const firmId = session.user.firmId;

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const body = await request.json();
    const parsed = generateStreamSchema.safeParse(body);
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

    const template = getTemplateById(parsed.data.templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    let prompt = template.basePrompt;

    const caseData = parsed.data.caseId
      ? await (async () => {
          try {
            const { getCaseById } = await import("@/lib/services/cases.service");
            return await getCaseById(firmId, parsed.data.caseId!);
          } catch {
            return null;
          }
        })()
      : null;

    if (caseData) {
      const parties = await db
        .select({
          role: caseParties.role,
          contactFirstName: contacts.firstName,
          contactLastName: contacts.lastName,
          contactCompanyName: contacts.companyName,
          contactIdentityNumber: contacts.identityNumber,
        })
        .from(caseParties)
        .leftJoin(contacts, eq(caseParties.contactId, contacts.id))
        .where(eq(caseParties.caseId, parsed.data.caseId!));

      const partiesText = parties
        .map((p) => `  - Rol: ${p.role} | ${p.contactFirstName ? `Nombre: ${p.contactFirstName} ${p.contactLastName}` : `Empresa: ${p.contactCompanyName}`}${p.contactIdentityNumber ? ` | RTN/DNI: ${p.contactIdentityNumber}` : ""}`)
        .join("\n");

      const caseContext = `\n\n## DATOS DEL CASO\n- Número: ${caseData.number}\n- Título: ${caseData.title}\n- Descripción: ${caseData.description ?? "(sin descripción)"}\n- Materia: ${caseData.matter}\n- Estado: ${caseData.status}\n\n## PARTES DEL PROCESO\n${partiesText || "(sin partes registradas)"}`;
      prompt += caseContext;

      let jurisprudenciaText = "";
      try {
        const jurisprudencia = await searchSimilarDocuments(
          `${caseData.matter} ${caseData.title} ${caseData.description ?? ""}`,
          3,
        );
        if (jurisprudencia.length > 0) {
          jurisprudenciaText = "\n\n## JURISPRUDENCIA RELEVANTE\n" + jurisprudencia
            .map((j) => `- ${j.title} (${j.source}): ${j.content.substring(0, 1000)}`)
            .join("\n\n");
          prompt += jurisprudenciaText;
        }
      } catch {
        // Embeddings no disponibles
      }
    }

    prompt += `\n\n## ESTRUCTURA DEL DOCUMENTO\n${template.estructura.map((e, i) => `${i + 1}. ${e}`).join("\n")}`;

    if (parsed.data.customPrompt) {
      prompt += `\n\n## INDICACIONES ADICIONALES DEL USUARIO\n${parsed.data.customPrompt}`;
    }

    prompt += `\n\n## INSTRUCCIONES FINALES\n1. Genera el documento en español, con lenguaje jurídico formal hondureño.\n2. Sigue EXACTAMENTE la estructura indicada.\n3. Si hay jurisprudencia disponible, cítala donde sea relevante.\n4. No inventes artículos ni citas que no estén en el contexto.\n5. El documento debe estar listo para revisión por un abogado.`;

    const stream = await streamAI(prompt, { temperature: 0.3, maxOutputTokens: 4096 });

    return stream.toTextStreamResponse();
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error in generate-stream:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al generar el borrador" }, { status: 500 });
  }
}
