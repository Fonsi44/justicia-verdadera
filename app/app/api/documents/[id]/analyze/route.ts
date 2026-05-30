import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { AppError } from "@/lib/errors";
import { getDocumentById } from "@/lib/services/documents.service";
import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

const model = deepseek("deepseek-v4-flash");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const doc = await getDocumentById(firmId, id);
    if (!doc || !doc.ocrText) {
      return NextResponse.json({ error: "Documento no tiene texto OCR disponible" }, { status: 400 });
    }

    const prompt = `Eres un asistente jurídico experto en analizar documentos legales hondureños.

DOCUMENTO A ANALIZAR:
Título: ${doc.name}
Tipo: ${doc.type || "No especificado"}
Texto extraído (OCR):
${doc.ocrText.substring(0, 8000)}

INSTRUCCIONES: Analiza este documento legal y extrae la siguiente información en formato JSON. Responde EXCLUSIVAMENTE con el JSON, sin texto adicional:

{
  "tipoDocumento": "tipo de documento legal identificado",
  "resumen": "resumen ejecutivo del documento en 3-4 oraciones",
  "partes": ["lista de personas, entidades o partes mencionadas"],
  "fechasClave": [
    {"descripcion": "descripción de la fecha", "fecha": "fecha identificada"}
  ],
  "plazos": [
    {"descripcion": "descripción del plazo", "dias": número de días}
  ],
  "fundamentosLegales": ["artículos, códigos o leyes citadas"],
  "puntosClave": ["lista de puntos clave del documento"],
  "materia": "rama del derecho (civil/penal/laboral/familia/mercantil/constitucional)",
  "riesgos": ["posibles riesgos legales identificados"]
}`;

    const result = await generateText({ model, prompt, temperature: 0.2, maxOutputTokens: 2048 });

    let analysis;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "No se pudo parsear el análisis", raw: result.text };
    } catch {
      analysis = { error: "Error al parsear análisis", raw: result.text };
    }

    return NextResponse.json({ data: analysis });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error analyzing document:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al analizar documento" }, { status: 500 });
  }
}
