import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`
      CREATE EXTENSION IF NOT EXISTS vector;
    `;
    console.log("✅ pgvector extension verified");

    await sql`
      CREATE TABLE IF NOT EXISTS legal_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        chunk_index INTEGER DEFAULT 0 NOT NULL,
        embedding vector(1536),
        metadata JSONB,
        verified_by UUID REFERENCES users(id),
        verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT now() NOT NULL
      );
    `;
    console.log("✅ legal_documents table created");

    await sql`
      CREATE INDEX IF NOT EXISTS legal_docs_source_idx ON legal_documents(source);
    `;
    console.log("✅ legal_docs_source_idx created");
  } catch (e) {
    console.error("❌ Error:", (e as Error).message);
  }
}

main();
