import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const [user] = await sql`SELECT email, role, firm_id FROM users WHERE email = 'alfonsroiget@gmail.com'`;
  if (user) {
    const [firm] = await sql`SELECT subscription_status, subscription_tier FROM firms WHERE id = ${user.firm_id}`;
    console.log("Usuario:", user.email, "| Rol:", user.role);
    console.log("Firm:", firm.subscription_status, "| Tier:", firm.subscription_tier);
    
    // Check subscription_gate
    const status = firm.subscription_status || "trial";
    const allowed = ["active", "past_due"];
    console.log("Estado:", status, "| Acceso permitido?", status in allowed || allowed.includes(status));
    
    // Check if subscription is the issue
    if (!allowed.includes(status)) {
      console.log("⚠️ El usuario NO pasa el gate de suscripcion");
      console.log("   Activando...");
      await sql`UPDATE firms SET subscription_status = 'active', subscription_tier = 'enterprise' WHERE id = ${user.firm_id}`;
      console.log("   ✅ Activado");
    }
  } else {
    console.log("Usuario no encontrado");
  }
}
main();
