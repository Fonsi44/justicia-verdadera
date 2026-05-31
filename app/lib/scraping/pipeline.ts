import { db } from "@/lib/db";
import { legalDocuments } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { fetchUrl } from "./fetcher";
import { parseHtmlDocument, parsePdfText, detectContentType } from "./parsers";
import { LEGAL_SOURCES } from "./sources";
import { chunkWithMetadata } from "@/lib/ai/chunking";
import { generateEmbedding } from "@/lib/ai/embeddings";
import type { LegalSource, ScrapedDocument, ScrapingResult } from "./types";

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;

async function ingestChunks(source: string, title: string, content: string): Promise<number> {
  const chunks = chunkWithMetadata(source, title, content, CHUNK_SIZE, CHUNK_OVERLAP);
  let stored = 0;

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      await db.insert(legalDocuments).values({
        source: chunk.source,
        title: chunk.title,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: embedding,
      } as typeof legalDocuments.$inferInsert);
      stored++;
    } catch (error) {
      console.error(`[Ingester] Error storing chunk ${chunk.chunkIndex} from ${source}:`, error);
    }
  }

  return stored;
}

async function scrapeSource(source: LegalSource): Promise<ScrapingResult> {
  const errors: string[] = [];
  let documentsScraped = 0;
  let chunksStored = 0;
  const startTime = Date.now();

  console.log(`\n[Scraper] Iniciando: ${source.name} (${source.urls.length} URLs)`);

  for (const url of source.urls) {
    try {
      const result = await fetchUrl({ url });

      let doc: ScrapedDocument;

      const contentType = detectContentType(
        { "content-type": result.html.startsWith("%PDF") ? "application/pdf" : "text/html" },
        url
      );

      if (contentType === "pdf") {
        doc = parsePdfText(source.id, result.html, undefined, url);
      } else {
        doc = parseHtmlDocument(source.id, result.html, url);
      }

      documentsScraped++;

      const stored = await ingestChunks(doc.source, doc.title, doc.content);
      chunksStored += stored;

      console.log(`[Scraper]   → "${doc.title}" — ${doc.content.length} chars → ${stored} chunks`);
    } catch (error) {
      const msg = `Error en ${url}: ${error instanceof Error ? error.message : error}`;
      errors.push(msg);
      console.error(`[Scraper]   ✗ ${msg}`);
    }
  }

  const duration = Date.now() - startTime;
  return { sourceId: source.id, documentsScraped, chunksStored, errors, duration };
}

export async function scrapeAllSources(): Promise<ScrapingResult[]> {
  const results: ScrapingResult[] = [];
  const sorted = [...LEGAL_SOURCES].sort((a, b) => a.priority - b.priority);

  console.log("=".repeat(60));
  console.log("🧑‍⚖️ INICIANDO SCRAPING DEL CORPUS LEGAL HONDUREÑO");
  console.log(`Fuentes: ${sorted.length}`);
  console.log("=".repeat(60));

  for (const source of sorted) {
    const result = await scrapeSource(source);
    results.push(result);

    if (sorted.indexOf(source) < sorted.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  const totalDocs = results.reduce((s, r) => s + r.documentsScraped, 0);
  const totalChunks = results.reduce((s, r) => s + r.chunksStored, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DEL SCRAPING");
  console.log(`Total documentos: ${totalDocs}`);
  console.log(`Total chunks almacenados: ${totalChunks}`);
  console.log(`Errores: ${totalErrors}`);
  console.log("=".repeat(60));

  return results;
}

export async function scrapeSourceById(sourceId: string): Promise<ScrapingResult | null> {
  const source = LEGAL_SOURCES.find((s) => s.id === sourceId);
  if (!source) return null;
  return scrapeSource(source);
}

export async function clearSourceFromCorpus(sourceId: string): Promise<number> {
  const result = await db.delete(legalDocuments).where(eq(legalDocuments.source, sourceId));
  return result.rowCount ?? 0;
}

export async function getCorpusStats(): Promise<{
  totalChunks: number;
  sources: { source: string; count: number }[];
}> {
  const rows = await db
    .select({
      source: legalDocuments.source,
      count: sql<number>`count(*)::int`,
    })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count DESC`);

  const total = rows.reduce((s, r) => s + r.count, 0);

  return { totalChunks: total, sources: rows };
}
