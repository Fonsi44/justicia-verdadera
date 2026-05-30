import { db } from "@/lib/db";
import { firms, users } from "@/database/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const [existingFirm] = await db
    .select({ id: firms.id })
    .from(firms)
    .where(eq(firms.slug, "despacho-demo"))
    .limit(1);

  if (existingFirm) {
    console.log("Seed already exists, skipping.");
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "admin@justiciaverdadera.com"))
      .limit(1);

    if (existingUser) {
      console.log("Demo user already exists.");
    } else {
      await db
        .insert(users)
        .values({
          firmId: existingFirm.id,
          name: "Admin Demo",
          email: "admin@justiciaverdadera.com",
          role: "owner",
          phone: "+504 1234-5678",
        })
        .onConflictDoNothing();
      console.log("Created demo user.");
    }
    return;
  }

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

  await db
    .insert(users)
    .values({
      firmId: firm.id,
      name: "Admin Demo",
      email: "admin@justiciaverdadera.com",
      role: "owner",
      phone: "+504 1234-5678",
    })
    .onConflictDoNothing();

  console.log("Created demo user");
  console.log("Seed complete!");
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));