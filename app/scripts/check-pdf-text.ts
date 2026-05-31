import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

const PDF_PATH = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";

async function main() {
  console.log("📄 Analizando PDF...");
  const data = new Uint8Array(fs.readFileSync(PDF_PATH));
  const doc = await getDocument({ data }).promise;
  console.log(`Páginas: ${doc.numPages}`);

  // Try extracting text from first 3 pages
  let totalText = "";
  for (let i = 1; i <= Math.min(3, doc.numPages); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item: any) => item.str).join(" ");
    totalText += text + "\n";
    console.log(`Página ${i}: ${text.length} caracteres`);
  }

  if (totalText.trim().length > 0) {
    console.log(`\n✅ PDF TIENE CAPA DE TEXTO (${totalText.length} chars en 3 páginas)`);
    console.log(`Preview: ${totalText.substring(0, 300)}`);

    // Extract ALL pages
    console.log("\n📚 Extrayendo todas las páginas...");
    let allText = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      allText += text + "\n";
      if (i % 50 === 0) console.log(`   ${i}/${doc.numPages} páginas...`);
    }

    const outPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_completa.txt";
    fs.writeFileSync(outPath, allText, "utf8");
    console.log(`✅ Texto completo: ${allText.length} caracteres`);
    console.log(`   Guardado en: ${outPath}`);
  } else {
    console.log("\n❌ PDF ESCANEADO - Sin capa de texto seleccionable");
    console.log("Se necesita convertir páginas a imágenes para OCR.");

    // Render first page to image to check if it's possible
    console.log("\n🖼️ Probando renderizado de página a imagen...");
    try {
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      console.log(`   Tamaño de página: ${viewport.width}x${viewport.height}`);
      console.log("   pdfjs-dist puede renderizar páginas a canvas");
      console.log("   Pero necesita 'canvas' npm package para Node.js");
      console.log("\n💡 Alternativa más práctica:");
      console.log("   1. npm install canvas (nativo, requiere build tools)");
      console.log("   2. O mejor: usa https://www.ilovepdf.com/es/pdf-a-jpg");
      console.log("   3. O Google Drive → Google Docs (OCR automático)");
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }
  }
}

main().catch((e) => console.error("Error:", e.message));
