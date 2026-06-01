/**
 * OCR con tesseract.js para PDFs escaneados.
 * Usado como fallback cuando PyMuPDF no extrae texto (PDFs del gobierno HN).
 * Uso: npx tsx scripts/ocr-tesseract-cli.ts <directorio_de_imagenes>
 */

import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";

async function main() {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) {
    process.stderr.write("ERROR: directorio no encontrado\n");
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .sort();

  if (files.length === 0) {
    process.stdout.write("");
    process.exit(0);
  }

  const worker = await createWorker("spa", 1, {
    logger: () => {}, // silenciar logs de progreso
  });

  let totalText = "";

  for (const file of files) {
    try {
      const filePath = path.join(dir, file);
      const {
        data: { text },
      } = await worker.recognize(filePath);
      const clean = text.trim();
      if (clean.length > 10) {
        totalText += clean + "\n";
      }
    } catch {
      // pagina ilegible, continuar
    }
  }

  await worker.terminate();
  process.stdout.write(totalText.trim());
}

main().catch(() => process.exit(1));
