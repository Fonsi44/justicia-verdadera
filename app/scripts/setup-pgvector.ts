import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

async function setupPgvector() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL no configurada en .env.local");
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);

  console.log("🔧 Activando extensión pgvector en Neon DB...");

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log("✅ Extensión pgvector activada correctamente");
  } catch (error) {
    console.error("❌ Error al activar pgvector:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  try {
    const [result] = await sql`SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`;
    console.log(`   Versión: ${result.extversion}`);
  } catch {
    // ignore
  }

  console.log("\n📋 Ahora ejecuta: npx drizzle-kit push");
}

setupPgvector();
