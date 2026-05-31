import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { documents, legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import fs from "fs";

async function main() {
  // 1. Read extracted text
  const txtPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_completa.txt";
  const text = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, "utf8") : "";

  if (text.length > 0) {
    // 2. Update document record
    const [doc] = await db
      .update(documents)
      .set({
        ocrText: text.substring(0, 50000),
        ocrConfidence: 95,
        processingStatus: "ocr_complete",
      })
      .where(eq(documents.name, "Constitución de la República de Honduras"))
      .returning({ id: documents.id });

    if (doc) {
      console.log(`📄 Documento actualizado: https://justicia-verdadera.vercel.app/documentos/${doc.id}`);
    }
  }

  // 3. Show corpus stats
  const stats = await db
    .select({
      source: legalDocuments.source,
      count: sql<number>`count(*)::int`,
    })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n📊 CORPUS LEGAL");
  console.log("=".repeat(50));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
    total += s.count;
  }
  console.log("=".repeat(50));
  console.log(`   TOTAL: ${total} chunks`);
}

main().catch((e) => console.error("Error:", e));
