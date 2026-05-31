const { createWorker } = require("tesseract.js");
const fs = require("fs");
const path = require("path");

async function main() {
  const pagesDir = "C:\\Users\\Admin\\AppData\\Local\\Temp\\contratacion_pages";
  const files = fs.readdirSync(pagesDir).filter(f => f.endsWith(".png")).sort();
  console.log("OCR en " + files.length + " páginas con tesseract.js...");

  const worker = await createWorker("spa");
  let allText = "";

  for (const file of files) {
    const p = path.join(pagesDir, file);
    const { data } = await worker.recognize(p);
    allText += data.text + "\n";
    process.stdout.write(".");
  }

  await worker.terminate();

  const outPath = "C:\\Users\\Admin\\AppData\\Local\\Temp\\ley_contratacion_completa.txt";
  fs.writeFileSync(outPath, allText, "utf8");
  console.log("\n✅ Extraído: " + allText.length + " caracteres");
  console.log("Preview:\n" + allText.substring(0, 500));

  // Cleanup
  for (const f of files) fs.unlinkSync(path.join(pagesDir, f));
  fs.rmdirSync(pagesDir);
}

main().catch(e => console.error("Error:", e.message));
