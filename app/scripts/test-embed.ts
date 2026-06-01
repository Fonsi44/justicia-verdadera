import { config } from "dotenv";
config({ path: ".env.local" });
import { generateEmbedding } from "../lib/ai/embeddings";
import { chunkWithMetadata } from "../lib/ai/chunking";

async function main() {
  const text = "Test de embedding para verificar que la funcion generateEmbeddingLocal funciona correctamente con caracteres especiales como áéíóúñü y números 12345.";
  
  console.log("1. Probando generateEmbedding...");
  const e = await generateEmbedding(text);
  console.log("   OK:", e.length, "dimensiones, primeros 3:", e.slice(0, 3));
  
  console.log("2. Probando chunkWithMetadata...");
  const chunks = chunkWithMetadata("test", "Test", "Artículo 1. Honduras es un Estado de Derecho. Artículo 2. La soberanía corresponde al pueblo.");
  console.log("   Chunks:", chunks.length);
  
  console.log("3. Probando generacion completa de embedding por chunk...");
  for (const c of chunks) {
    const emb = await generateEmbedding(c.content);
    console.log(`   Chunk ${c.chunkIndex}: ${c.content.substring(0, 50)}... → ${emb.length} dims OK`);
  }
  
  console.log("\n✅ Todo funciona correctamente");
}

main().catch(e => console.error("Error:", e.message));
