import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { requireActiveSubscription } from "@/lib/middleware/plan-limits";
import { AppError } from "@/lib/errors";
import { searchSimilarDocuments } from "@/lib/ai/embeddings";
import { generateText, streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";

const model = deepseek("deepseek-v4-flash");

async function gateSubscription() {
  const firmId = await getFirmId();
  await requireActiveSubscription(firmId);
  return firmId;
}

export async function GET(req: NextRequest) {
  try {
    const firmId = await gateSubscription();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const source = searchParams.get("source") ?? undefined;
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "5"));

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: "Consulta demasiado corta. Mínimo 3 caracteres." }, { status: 400 });
    }

    const results = await searchSimilarDocuments(query, limit, source);
    return NextResponse.json({ data: results, total: results.length });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error en búsqueda legal:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error en búsqueda" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await gateSubscription();
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return NextResponse.json({ error: "Consulta muy corta" }, { status: 400 });
    }

    const docs = await searchSimilarDocuments(query, 5);
    const context = docs.map((d) => `Fuente: ${d.source}\nTítulo: ${d.title}\nContenido: ${d.content}`).join("\n\n---\n\n");

    const prompt = `Eres un asistente jurídico experto en derecho hondureño. Responde a la consulta del abogado basándote EXCLUSIVAMENTE en los documentos legales proporcionados. Si no encuentras la respuesta en el contexto, indícalo claramente.

CONTEXTO LEGAL:
${context || "(No se encontraron documentos relevantes en el corpus legal)"}

CONSULTA DEL ABOGADO: ${query}

INSTRUCCIONES:
1. Responde en español, de forma clara y precisa.
2. Cita los artículos y fuentes específicos cuando sea posible.
3. Si el contexto no contiene información suficiente, indica: "No encontré información suficiente en el corpus legal disponible."
4. No inventes artículos ni jurisprudencia.`;

    const result = await generateText({ model, prompt, temperature: 0.3, maxOutputTokens: 2048 });
    return NextResponse.json({
      answer: result.text,
      sources: docs.map((d) => ({ title: d.title, source: d.source })),
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error en chat legal:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al procesar consulta" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await gateSubscription();
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Consulta requerida" }, { status: 400 });
    }

    const docs = await searchSimilarDocuments(query, 5);
    const context = docs.map((d) => `Fuente: ${d.source}\n${d.content}`).join("\n\n---\n\n");

    const stream = streamText({
      model,
      prompt: `Eres un asistente jurídico experto en derecho hondureño. Responde usando SOLO el contexto proporcionado.

CONTEXTO:
${context || "(Sin documentos relevantes)"}

CONSULTA: ${query}

Responde en español, citando fuentes.`,
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    return stream.toTextStreamResponse();
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error en streaming:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error en streaming" }, { status: 500 });
  }
}
