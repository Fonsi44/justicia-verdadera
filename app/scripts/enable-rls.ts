import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

interface PolicyStep {
  table: string;
  ddl: string;
}

const steps: PolicyStep[] = [
  {
    table: "cases",
    ddl: `ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cases' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON cases FOR ALL USING (firm_id = current_setting('app.current_firm_id')::uuid);
  END IF;
END $$;`,
  },
  {
    table: "contacts",
    ddl: `ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON contacts FOR ALL USING (firm_id = current_setting('app.current_firm_id')::uuid);
  END IF;
END $$;`,
  },
  {
    table: "documents",
    ddl: `ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON documents FOR ALL USING (firm_id = current_setting('app.current_firm_id')::uuid);
  END IF;
END $$;`,
  },
  {
    table: "invoices",
    ddl: `ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON invoices FOR ALL USING (firm_id = current_setting('app.current_firm_id')::uuid);
  END IF;
END $$;`,
  },
  {
    table: "case_events",
    ddl: `ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_events' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON case_events FOR ALL USING (
      case_id IN (SELECT id FROM cases WHERE firm_id = current_setting('app.current_firm_id')::uuid)
    );
  END IF;
END $$;`,
  },
  {
    table: "case_parties",
    ddl: `ALTER TABLE case_parties ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'case_parties' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON case_parties FOR ALL USING (
      case_id IN (SELECT id FROM cases WHERE firm_id = current_setting('app.current_firm_id')::uuid)
    );
  END IF;
END $$;`,
  },
  {
    table: "time_entries",
    ddl: `ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'time_entries' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON time_entries FOR ALL USING (
      case_id IN (SELECT id FROM cases WHERE firm_id = current_setting('app.current_firm_id')::uuid)
    );
  END IF;
END $$;`,
  },
  {
    table: "document_versions",
    ddl: `ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'document_versions' AND policyname = 'tenant_isolation') THEN
    CREATE POLICY tenant_isolation ON document_versions FOR ALL USING (
      document_id IN (SELECT id FROM documents WHERE firm_id = current_setting('app.current_firm_id')::uuid)
    );
  END IF;
END $$;`,
  },
];

async function main() {
  console.log("🔐 Enabling Row-Level Security...\n");

  for (const step of steps) {
    try {
      await sql.query(step.ddl);
      console.log(`  ✅ RLS enabled on "${step.table}"`);
    } catch (e) {
      console.error(`  ❌ Error on "${step.table}":`, (e as Error).message);
    }
  }

  console.log("\n✅ RLS setup complete");
}

main();
