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
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (text.length < 100) {
    console.log(`Saltado: texto insuficiente (${text.length} chars)`);
    process.exit(0);
  }

  await db.delete(legalDocuments).where(eq(legalDocuments.source, sourceId));

  const chunks = chunkWithMetadata(sourceId, title, text);
  let stored = 0;

  for (const c of chunks) {
    try {
      const e = await generateEmbedding(c.content);
      await db.insert(legalDocuments).values({
        source: c.source, title: c.title, content: c.content,
        chunkIndex: c.chunkIndex, embedding: e,
      });
      stored++;
    } catch (e) { break; }
  }

  console.log(`${sourceId}: ${text.length} chars -> ${stored} chunks`);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
