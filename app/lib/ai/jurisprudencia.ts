import { generateText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { ilike } from "drizzle-orm";

const model = deepseek("deepseek-v4-flash");

export async function suggestJurisprudence(
  caseMatter: string,
  caseDescription: string,
  limit = 5
): Promise<Array<{ title: string; content: string; source: string; razon: string }>> {
  const relevantDocs = await db
    .select({ title: legalDocuments.title, content: legalDocuments.content, source: legalDocuments.source })
    .from(legalDocuments)
    .where(ilike(legalDocuments.source, "jurisprudencia_csj%"))
    .limit(10);

  const docsForPrompt = relevantDocs
    .map((d, i) => `DOC ${i + 1}: ${d.title}\nFuente: ${d.source}\n${d.content.substring(0, 2000)}`)
    .join("\n\n---\n\n");

  const prompt = `Eres un abogado experto en jurisprudencia hondureña.

MATERIA DEL CASO: ${caseMatter}
DESCRIPCIÓN DEL CASO: ${caseDescription}

JURISPRUDENCIA DISPONIBLE:
${docsForPrompt}

INSTRUCCIONES: De los documentos jurisprudenciales disponibles, selecciona los ${limit} más relevantes para este caso. Responde EXCLUSIVAMENTE con JSON:

{
  "sugerencias": [
    {
      "titulo": "título de la sentencia",
      "fuente": "fuente",
      "extracto": "extracto relevante del contenido",
      "razon": "por qué esta jurisprudencia es relevante para el caso"
    }
  ]
}`;

  const result = await generateText({ model, prompt, temperature: 0.2, maxOutputTokens: 2048 });

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.sugerencias || [];
  } catch {
    return [];
  }
}
