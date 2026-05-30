import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    // Create ivfflat index for cosine similarity search on legal_documents
    await sql`
      CREATE INDEX IF NOT EXISTS legal_docs_embedding_idx
      ON legal_documents
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `;
    console.log("✅ ivfflat index created on legal_documents.embedding");
  } catch (e) {
    console.error("❌ Error:", (e as Error).message);
  }
}

main();
