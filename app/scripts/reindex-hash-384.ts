import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

function genEmb(text: string): number[] {
  const d = 384;
  const v = new Float64Array(d);
  let i = 0, h = 0, w = 0;
  while (i < text.length) {
    const c = text.charCodeAt(i);
    const ok = (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || ((c >= 224 && c <= 252) && c !== 240 && c !== 248);
    if (ok) { h = ((h << 5) - h + c) | 0; w++;
      if (i > 0 && text.charCodeAt(i-1) !== 32) v[Math.abs((c ^ (text.charCodeAt(i-1) << 5)) % d)] += 0.3;
    } else if (c === 32 && w > 0) { v[Math.abs(h) % d] += 1; h = 0; w = 0; }
    i++;
  }
  if (w > 0) v[Math.abs(h) % d] += 1;
  let m = 0;
  for (let j = 0; j < d; j++) m += v[j] * v[j];
  m = Math.sqrt(m);
  if (m > 0) for (let j = 0; j < d; j++) v[j] /= m;
  return Array.from(v);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const [c] = await sql`SELECT count(*)::int as n FROM legal_documents WHERE embedding IS NULL`;
  const total = c.n;
  console.log(`Re-indexando ${total} chunks a 384 dims...`);

  let done = 0;
  const start = Date.now();
  const CONCURRENCY = 10;

  while (done < total) {
    const rows = await sql`SELECT id, content FROM legal_documents WHERE embedding IS NULL ORDER BY id LIMIT ${CONCURRENCY * 20}`;
    if (rows.length === 0) break;

    // Run concurrent updates
    const promises = rows.map(r => {
      const emb = genEmb(r.content as string);
      const s = `[${emb.join(",")}]`;
      return sql`UPDATE legal_documents SET embedding = ${s}::vector WHERE id = ${r.id}::uuid`;
    });

    await Promise.all(promises);
    done += rows.length;

    const el = ((Date.now() - start) / 1000).toFixed(0);
    const rate = (done / parseInt(el || "1")).toFixed(1);
    console.log(`  ${done}/${total} (${(done/total*100).toFixed(1)}%) - ${el}s - ${rate}/s`);
  }

  const el = ((Date.now() - start) / 1000).toFixed(0);
  console.log(`\nCompletado: ${done} chunks en ${el}s`);

  const [p] = await sql`SELECT count(*)::int as n FROM legal_documents WHERE embedding IS NULL`;
  console.log(`Pendientes: ${p.n}`);

  const [sz] = await sql`SELECT pg_size_pretty(pg_total_relation_size('legal_documents'::regclass)) as s`;
  console.log(`Tamaño: ${sz.s}`);
}

main().catch(console.error);
