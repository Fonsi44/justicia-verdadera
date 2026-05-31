import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  const users = await sql`
    SELECT id, email, name, role, firm_id 
    FROM users 
    WHERE email IN ('alfonsroiget@gmail.com', 'alfonsroiget@outlook.com')
  `;
  
  console.log("Usuarios encontrados:", users.length);
  
  for (const u of users) {
    console.log(`  ${u.email} | role: ${u.role} | firm_id: ${u.firm_id}`);
    await sql`UPDATE users SET role = 'owner' WHERE id = ${u.id}`;
    await sql`UPDATE firms SET subscription_status = 'active', subscription_tier = 'enterprise', ai_spending_limit = '99999' WHERE id = ${u.firm_id}`;
    console.log("  ✅ Activado: owner + enterprise + sin limites de IA");
  }
}
main();
