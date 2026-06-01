import { config } from "dotenv";
import path from "path";
config({ path: path.join(process.cwd(), ".env.local") });
import { db } from "./lib/db";
import { legalDocuments } from "./database/schema";

async function test() {
  try {
    await db.insert(legalDocuments).values({
      source: "test-source", title: "Test", content: Array(50).fill("Hello world test content ").join(""),
      chunkIndex: 0,
    });
    console.log("INSERT OK");
  } catch (e: any) {
    console.error("FULL ERROR MESSAGE:", e.message);
    if (e.message && e.message.includes("Failed query")) {
      const start = e.message.indexOf("Failed query:");
      console.error("SQL ERROR:", e.message.slice(start));
    }
  }
  process.exit(0);
}
test();
