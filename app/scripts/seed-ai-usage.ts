import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/database/schema";
import { config } from "dotenv";
import { eq, count } from "drizzle-orm";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const { firms, users, aiUsage } = schema;

function rng() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff;
}

function randomDate(start: Date, end: Date) {
  const t = start.getTime() + rng() * (end.getTime() - start.getTime());
  return new Date(t);
}

async function main() {
  const [firm] = await db
    .select({ id: firms.id, slug: firms.slug })
    .from(firms)
    .limit(1);

  if (!firm) {
    console.error("❌ No hay firmas en la base de datos. Ejecuta primero seed-demo-full.ts");
    process.exit(1);
  }

  const allUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.firmId, firm.id))
    .limit(5);

  if (allUsers.length === 0) {
    console.error("❌ No hay usuarios en la firma. Ejecuta primero seed-demo-full.ts");
    process.exit(1);
  }

  const firmId = firm.id;

  const existing = await db
    .select({ count: count() })
    .from(aiUsage)
    .where(eq(aiUsage.firmId, firmId));

  if (Number(existing[0]?.count ?? 0) > 100) {
    console.log(`ℹ️  Ya existen ${existing[0]?.count} registros de uso de IA. Omitiendo seed.`);
    return;
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const MODELS = ["deepseek-v4-flash", "text-embedding-3-small", "deepseek-v4-flash", "deepseek-v4-flash"];

  const records: Array<typeof aiUsage.$inferInsert> = [];

  for (let i = 0; i < 150; i++) {
    const model = MODELS[i % MODELS.length];
    const isEmbedding = model === "text-embedding-3-small";
    const promptTokens = isEmbedding
      ? Math.floor(200 + rng() * 1800)
      : Math.floor(500 + rng() * 4000);
    const completionTokens = isEmbedding
      ? 0
      : Math.floor(100 + rng() * 2000);
    const tokenCount = promptTokens + completionTokens;

    let cost: number;
    if (model === "text-embedding-3-small") {
      cost = (promptTokens / 1000000) * 0.02;
    } else {
      cost = (promptTokens / 1000000) * 0.14 + (completionTokens / 1000000) * 0.55;
    }
    cost = Math.round(cost * 1000000) / 1000000;

    records.push({
      firmId,
      userId: allUsers[i % allUsers.length].id,
      model,
      promptTokens,
      completionTokens,
      cost: String(cost),
      createdAt: randomDate(thirtyDaysAgo, now),
    } as any);
  }

  for (const rec of records) {
    await db.insert(aiUsage).values(rec);
  }

  const totalCost = records.reduce((sum, r) => sum + Number(r.cost ?? 0), 0);

  console.log(`✅ Insertados ${records.length} registros de uso de IA`);
  console.log(`   - Modelos: deepseek-v4-flash, text-embedding-3-small`);
  console.log(`   - Período: últimos 30 días`);
  console.log(`   - Costo total generado: $${totalCost.toFixed(4)}`);
  console.log(`   - Firma: ${firm.slug} (${firmId})`);
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
