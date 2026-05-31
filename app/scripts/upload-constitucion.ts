import { config } from "dotenv";
config({ path: ".env.local" });

import { UTApi } from "uploadthing/server";
import { db } from "../lib/db";
import { documents, documentVersions } from "../database/schema";
import { firms } from "../database/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

const PDF_PATH = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";
const PDF_URL = "https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf";

async function main() {
  console.log("🧑‍⚖️ SUBIENDO CONSTITUCIÓN DE HONDURAS AL SISTEMA");
  console.log("=".repeat(55));

  // 1. Ensure PDF exists
  if (!fs.existsSync(PDF_PATH)) {
    console.log("\n📥 Descargando PDF...");
    const resp = await fetch(PDF_URL);
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(PDF_PATH, buf);
    console.log(`   ✅ ${(buf.length / 1024).toFixed(0)} KB`);
  }

  const fileSize = fs.statSync(PDF_PATH).size;
  console.log(`\n📄 PDF listo: ${(fileSize / 1024).toFixed(0)} KB`);

  // 2. Upload to UploadThing
  console.log("\n📤 Subiendo a UploadThing...");
  let fileUrl: string;
  let fileKey: string;

  try {
    const utapi = new UTApi();
    const fileBuf = fs.readFileSync(PDF_PATH);
    const blob = new Blob([fileBuf], { type: "application/pdf" });
    const uploadResult = await utapi.uploadFiles(
      new File([blob], "Constitucion_de_la_Republica_de_Honduras.pdf", { type: "application/pdf" })
    );

    if (uploadResult.error) {
      throw new Error(`UploadThing error: ${JSON.stringify(uploadResult.error)}`);
    }

    fileUrl = uploadResult.data.url;
    fileKey = uploadResult.data.key;
    console.log(`   ✅ URL: ${fileUrl}`);
  } catch (error) {
    console.log(`   ❌ UploadThing falló: ${error instanceof Error ? error.message : error}`);
    console.log("   Usando URL original como fallback...");
    fileUrl = PDF_URL;
    fileKey = "original-poderjudicial";
  }

  // 3. Create document record directly in DB
  console.log("\n📝 Creando registro del documento...");

  const [firm] = await db.select({ id: firms.id }).from(firms).limit(1);
  if (!firm) {
    console.log("❌ No hay despachos en la BD. Crea uno primero en el dashboard.");
    return;
  }

  try {
    const [doc] = await db.insert(documents).values({
      firmId: firm.id,
      name: "Constitución de la República de Honduras",
      type: "otro",
      status: "final",
      processingStatus: "uploaded",
    } as typeof documents.$inferInsert).returning();

    // Create version record
    await db.insert(documentVersions).values({
      documentId: doc.id,
      version: 1,
      fileUrl: fileUrl,
      fileKey: fileKey,
      fileSize: fileSize,
      mimeType: "application/pdf",
      changes: "Documento original — Constitución 263 páginas",
    } as typeof documentVersions.$inferInsert);

    console.log(`\n✅ CONSTITUCIÓN SUBIDA Y REGISTRADA`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   URL: ${fileUrl}`);
    console.log(`   Estado: uploaded (Inngest procesará OCR automáticamente)`);
    console.log(`\n🔗 Ver en dashboard:`);
    console.log(`   https://justicia-verdadera.vercel.app/documentos/${doc.id}`);
    console.log(`\n⏳ El OCR tomará varios minutos (263 páginas escaneadas).`);
    console.log(`   Revisa el documento en el dashboard para ver el progreso.`);
  } catch (error) {
    console.error(`❌ Error al crear documento: ${error instanceof Error ? error.message : error}`);
  }
}

main().catch(console.error);
