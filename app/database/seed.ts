import { db } from "@/lib/db";
import { firms, users } from "@/database/schema";

async function seed() {
  console.log("Seeding database...");

  const [firm] = await db
    .insert(firms)
    .values({
      name: "Despacho Demo",
      slug: "despacho-demo",
      contactEmail: "demo@justiciaverdadera.com",
      contactPhone: "+504 1234-5678",
      address: "Tegucigalpa, Honduras",
    })
    .returning();

  console.log("Created firm:", firm.id);

  await db.insert(users).values({
    firmId: firm.id,
    name: "Admin Demo",
    email: "admin@justiciaverdadera.com",
    role: "owner",
    phone: "+504 1234-5678",
  });

  console.log("Created demo user");
  console.log("Seed complete!");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
