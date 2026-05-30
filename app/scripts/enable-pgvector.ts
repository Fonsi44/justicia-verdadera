import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("✅ pgvector extension created successfully");
  } catch (e) {
    console.error("❌ Error creating pgvector extension:", (e as Error).message);
  }
}

main();
