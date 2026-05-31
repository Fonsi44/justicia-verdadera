const { extractTextFromPdf } = require("./lib/ocr");
const fs = require("fs");
const path = require("path");

async function process() {
  const pdfPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";
  const outPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_ocr.txt";

  if (!fs.existsSync(pdfPath)) {
    console.log("❌ PDF no encontrado. Descargando...");
    const resp = await fetch("https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf");
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(pdfPath, buf);
    console.log(`✅ Descargado: ${(buf.length / 1024).toFixed(0)} KB`);
  }

  const stats = fs.statSync(pdfPath);
  console.log(`Procesando PDF: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);

  try {
    console.log("Ejecutando OCR vía pipeline existente...");
    const start = Date.now();
    const result = await extractTextFromPdf(
      "https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf"
    );
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`⏱️  ${elapsed}s`);
    
    if (result.text && result.text.length > 50) {
      fs.writeFileSync(outPath, result.text, "utf8");
      console.log(`✅ ${result.text.length} caracteres extraídos`);
      console.log(`Confianza: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`\nPreview:\n${result.text.substring(0, 800)}`);
    } else {
      console.log(`⚠️ Texto insuficiente: ${result.text?.length || 0} chars`);
      console.log("El PDF probablemente es escaneado (imágenes) sin capa de texto.");
      console.log("Para OCR de imágenes se requiere tesseract.js con worker.");
    }
  } catch (e) {
    console.log(`❌ Error OCR: ${e.message}`);
    console.log("\nLa Constitución es un PDF escaneado de 263 páginas.");
    console.log("El OCR por imágenes tomaría varios minutos.");
    console.log("Flujo recomendado en producción: subir a UploadThing → Inngest OCR async");
  }
}

process().catch(e => console.error("Fatal:", e));
