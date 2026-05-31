const { UTApi } = require("uploadthing/server");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function uploadConstitucion() {
  const pdfPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\constitucion_honduras.pdf";
  
  if (!fs.existsSync(pdfPath)) {
    console.log("❌ PDF no encontrado. Descargando...");
    const resp = await fetch("https://www.poderjudicial.gob.hn/Documentos%20compartidos/ConstituciondelaRep%C3%BAblica07.pdf");
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(pdfPath, buf);
    console.log(`✅ Descargado: ${(buf.length / 1024).toFixed(0)} KB`);
  }

  const stats = fs.statSync(pdfPath);
  console.log(`📄 Tamaño: ${(stats.size / 1024).toFixed(0)} KB`);
  console.log("📤 Subiendo a UploadThing...");

  try {
    const utapi = new UTApi();
    const file = fs.readFileSync(pdfPath);
    const blob = new Blob([file], { type: "application/pdf" });
    
    const uploadResult = await utapi.uploadFiles(
      new File([blob], "Constitucion_de_la_Republica_de_Honduras.pdf", { type: "application/pdf" })
    );
    
    if (uploadResult.error) {
      console.error("❌ Error UploadThing:", uploadResult.error);
      return null;
    }

    console.log(`✅ Subido: ${uploadResult.data.url}`);
    console.log(`   Key: ${uploadResult.data.key}`);
    return uploadResult.data;
  } catch (e) {
    console.error("❌ Error:", e.message);
    return null;
  }
}

uploadConstitucion().then(async (fileData) => {
  if (!fileData) {
    console.log("\n⚠️ No se pudo subir a UploadThing.");
    console.log("   Usando enfoque alternativo: creación directa con texto del seed.");
    return;
  }

  // Now create the document via the API
  const apiUrl = "https://justicia-verdadera.vercel.app/api/documents";
  console.log(`\n📝 Creando documento via API: ${apiUrl}`);
  
  try {
    const docResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": process.env.AUTH_COOKIE || ""
      },
      body: JSON.stringify({
        name: "Constitución de la República de Honduras",
        type: "otro",
        fileUrl: fileData.url,
        fileKey: fileData.key,
        status: "final",
        processingStatus: "uploaded"
      })
    });
    
    const result = await docResponse.json();
    if (docResponse.ok) {
      console.log(`✅ Documento creado: ${result.data?.id || result.id}`);
      console.log(`   URL: https://justicia-verdadera.vercel.app/documentos/${result.data?.id || result.id}`);
      console.log("\n⏳ Inngest procesará el OCR automáticamente en segundo plano.");
    } else {
      console.log(`❌ Error: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.error("❌ Error:", e.message);
  }
});
