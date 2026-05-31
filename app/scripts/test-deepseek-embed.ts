import { config } from "dotenv";
config({ path: ".env.local" });
import { generateEmbedding } from "../lib/ai/embeddings";

async function main() {
  const e = await generateEmbedding("Requisitos del contrato de arrendamiento segun el Codigo Civil");
  console.log("OK:", e.length, "dimensiones, primeros 3:", e.slice(0, 3));
}
main();
