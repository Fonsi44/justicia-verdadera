import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

interface SourceEntry {
  source: string;
  count: number;
}

async function main() {
  const [totalResult] = await sql`SELECT COUNT(*)::int AS count FROM legal_documents`;
  const totalDocs = totalResult.count;

  const [unverifiedResult] =
    await sql`SELECT COUNT(*)::int AS count FROM legal_documents WHERE verified_at IS NULL`;
  const unverifiedDocs = unverifiedResult.count;

  const [verifiedResult] =
    await sql`SELECT COUNT(*)::int AS count FROM legal_documents WHERE verified_at IS NOT NULL`;
  const verifiedDocs = verifiedResult.count;

  const obsoleteIds = await sql`
    UPDATE legal_documents
    SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"status":"obsolete"}'::jsonb
    WHERE source LIKE 'codigo_%'
      AND created_at < NOW() - INTERVAL '365 days'
      AND (metadata IS NULL OR metadata->>'status' IS DISTINCT FROM 'obsolete')
    RETURNING id
  `;
  const markedObsolete = obsoleteIds?.length ?? 0;

  const sourcesResult = await sql`
    SELECT source, COUNT(*)::int AS count
    FROM legal_documents
    GROUP BY source
    ORDER BY count DESC
  `;

  const sources: SourceEntry[] = (sourcesResult as SourceEntry[]).map(
    (r: SourceEntry) => ({
      source: r.source,
      count: r.count,
    })
  );

  const stats = {
    totalDocs,
    unverifiedDocs,
    verifiedDocs,
    markedObsolete,
    sources,
    timestamp: new Date().toISOString(),
  };

  console.log("=== Actualizaci\u00f3n del corpus legal ===");
  console.log(JSON.stringify(stats, null, 2));

  return stats;
}

main()
  .then(() => {
    console.log("\n\u2705 Actualizaci\u00f3n completada exitosamente.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\u274c Error actualizando corpus legal:", err);
    process.exit(1);
  });
