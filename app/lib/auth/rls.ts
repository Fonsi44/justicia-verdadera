import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function setFirmId(firmId: string): Promise<void> {
  try {
    await sql`SELECT set_config('app.current_firm_id', ${firmId}, true)`;
  } catch (error) {
    console.error("[RLS] Error setting firm_id:", error instanceof Error ? error.message : error);
  }
}
