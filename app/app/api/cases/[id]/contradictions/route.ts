import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, cases } from "@/database/schema";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

const model = deepseek("deepseek-v4-flash");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const firmId = await getFirmId();
    const { id: caseId } = await params;

    const [caseData] = await db
      .select({ id: cases.id, number: cases.number, title: cases.title })
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.firmId, firmId)))
      .limit(1);

    if (!caseData) {
      return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 });
    }

    const docs = await db
      .select({ id: documents.id, name: documents.name, type: documents.type, ocrText: documents.ocrText })
      .from(documents)
      .where(and(eq(documents.caseId, caseId), eq(documents.firmId, firmId)))
      .limit(15);

    const docsWithText = docs.filter((d) => d.ocrText && d.ocrText.length > 100);

    if (docsWithText.length < 2) {
      return NextResponse.json(
        { error: "Se necesitan al menos 2 documentos con texto OCR para detectar contradicciones. Actual: " + docsWithText.length },
        { status: 400 }
      );
    }

    const docsForPrompt = docsWithText
      .map((d, i) => `DOCUMENTO ${i + 1}: ${d.name} (${d.type || "sin tipo"})\nTEXTO:\n${d.ocrText!.substring(0, 3000)}`)
      .join("\n\n---\n\n");

    const prompt = `Eres un abogado experto en análisis jurídico comparativo de documentos legales hondureños.

A continuación se presentan ${docsWithText.length} documentos de un mismo caso legal (${caseData.number} - ${caseData.title}):

${docsForPrompt}

INSTRUCCIONES: Analiza estos documentos en profundidad y detecta cualquier contradicción, inconsistencia o discrepancia entre ellos. Responde EXCLUSIVAMENTE con JSON, sin texto adicional:

{
  "tieneContradicciones": true/false,
  "totalDocumentosAnalizados": ${docsWithText.length},
  "contradicciones": [
    {
      "documento1": "nombre del primer documento",
      "documento2": "nombre del segundo documento",
      "tipo": "fecha/hecho/parte/cifra/normativa/otro",
      "descripcion": "descripción de la contradicción detectada",
      "nivelRiesgo": "alto/medio/bajo",
      "recomendacion": "acción recomendada para resolver la contradicción"
    }
  ],
  "consistencias": [
    "puntos clave donde los documentos coinciden o se refuerzan mutuamente"
  ],
  "resumenGeneral": "resumen del análisis de consistencia documental del caso"
}`;

    const result = await generateText({ model, prompt, temperature: 0.3, maxOutputTokens: 4096 });

    let analysis;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "No se pudo parsear", raw: result.text };
    } catch {
      analysis = { error: "Error al parsear análisis", raw: result.text };
    }

    return NextResponse.json({ data: analysis });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error detecting contradictions:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al detectar contradicciones" }, { status: 500 });
  }
}
