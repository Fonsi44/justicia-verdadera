import { config } from "dotenv";
config({ path: ".env.local" });

import { extractTextFromPdf } from "../lib/ocr";
import fs from "fs";
import path from "path";

const PDF_URL = "https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf";
const PDF_LOCAL = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";

async function main() {
  console.log("🧑‍⚖️ PROCESANDO CONSTITUCIÓN DE HONDURAS");
  console.log("=".repeat(50));

  if (!fs.existsSync(PDF_LOCAL)) {
    console.log("\n📥 Descargando PDF...");
    const resp = await fetch(PDF_URL);
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(PDF_LOCAL, buf);
    console.log(`   ✅ ${(buf.length / 1024).toFixed(0)} KB`);
  }

  const stats = fs.statSync(PDF_LOCAL);
  console.log(`\n📄 Tamaño: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

  console.log("\n🔍 Extrayendo texto vía OCR pipeline (lib/ocr)...");
  const start = Date.now();

  try {
    const result = await extractTextFromPdf(PDF_URL);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`⏱️  ${elapsed}s`);

    if (result.text && result.text.length > 100) {
      const outPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_ocr.txt";
      fs.writeFileSync(outPath, result.text, "utf8");
      console.log(`✅ ÉXITO — ${result.text.length} caracteres extraídos`);
      console.log(`   Confianza: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`   Guardado en: ${outPath}`);
      console.log(`\n📝 Preview:\n${result.text.substring(0, 1000)}`);
    } else {
      console.log(`⚠️ Resultado insuficiente: ${result.text?.length || 0} chars`);
      console.log("\n📌 DIAGNÓSTICO:");
      console.log("   El PDF de la Constitución (263 páginas) NO tiene capa de texto.");
      console.log("   Es un documento escaneado — cada página es una imagen.");
      console.log("\n📋 OPCIONES:");
      console.log("   A) Subir a UploadThing desde el dashboard → Inngest OCR async");
      console.log("   B) Usar servidor dedicado con más RAM (VPS ~$20/mes)");
      console.log("   C) El seed actual (75 chunks) ya cubre el contenido clave de la Constitución");
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    console.log("\n📌 El PDF está escaneado y requiere procesamiento OCR por imágenes.");
    console.log("   Subirlo como documento en el dashboard activará el pipeline Inngest.");
  }
}

main().catch(console.error);
