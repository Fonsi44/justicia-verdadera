import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "./lib/db";
import { legalDocuments } from "./database/schema";
import { eq } from "drizzle-orm";
import { chunkWithMetadata } from "./lib/ai/chunking";
import { generateEmbedding } from "./lib/ai/embeddings";

const appDir = process.cwd();
config({ path: path.join(appDir, ".env.local") });

const sourceId = process.argv[2];
const title = process.argv[3];
const filePath = process.argv[4];

if (!sourceId || !title || !filePath) {
  console.error("Uso: npx tsx index-corpus-cli.ts <sourceId> <title> <archivo.txt>");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Archivo no encontrado: ${filePath}`);
  process.exit(1);
}

async function main() {
  const raw = fs.readFileSync(filePath, "utf8");
  const text = raw.replace(/\0/g, "").replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "").trim();
  if (text.length < 100) {
    console.log(`Saltado: texto insuficiente (${text.length} chars)`);
    process.exit(0);
  }

  // Eliminar chunks anteriores de esta fuente (si falla, ignorar y continuar)
  try {
    await db.delete(legalDocuments).where(eq(legalDocuments.source, sourceId));
  } catch {
    // Si el delete falla (pool saturado, permisos), intentar insertar de todas formas
    console.error(`Aviso: no se pudieron eliminar chunks previos de ${sourceId}, continuando...`);
  }

  const chunks = chunkWithMetadata(sourceId, title, text);
  let stored = 0;
  let skipped = 0;

  for (const c of chunks) {
    try {
      const e = await generateEmbedding(c.content);
      await db.insert(legalDocuments).values({
        source: c.source, title: c.title, content: c.content,
        chunkIndex: c.chunkIndex, embedding: e,
      });
      stored++;
    } catch (e) {
      skipped++;
      // Solo break si es error estructural (no continuar con mas chunks del mismo doc)
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Error en chunk ${c.chunkIndex} de ${sourceId}: ${msg.slice(0,200)}`);
      if (skipped > 2 || msg.includes("duplicate") || msg.includes("connection")) {
        break;
      }
    }
  }

  console.log(`${sourceId}: ${text.length} chars -> ${stored} chunks`);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
