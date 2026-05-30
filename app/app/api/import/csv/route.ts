import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { createContact } from "@/lib/services/contacts.service";
import { createCase } from "@/lib/services/cases.service";

const ALLOWED_TYPES = ["cases", "contacts"] as const;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const firmId = await getFirmId();

    const rateCheck = await checkRateLimit("api", firmId);
    if (rateCheck instanceof NextResponse) return rateCheck;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityType = formData.get("entityType") as string | null;

    if (!file || !entityType) {
      return NextResponse.json({ error: "Se requiere archivo CSV y entityType (cases|contacts)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(entityType as typeof ALLOWED_TYPES[number])) {
      return NextResponse.json({ error: "entityType debe ser 'cases' o 'contacts'" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: "El CSV debe tener al menos header + 1 fila de datos" }, { status: 400 });
    }

    const result: { imported: number; errors: number; errorRows: { row: number; error: string }[] } = {
      imported: 0,
      errors: 0,
      errorRows: [],
    };

    if (entityType === "contacts") {
      for (let i = 1; i < lines.length; i++) {
        try {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 3) {
            result.errors++;
            result.errorRows.push({ row: i + 1, error: "Fila inválida: se requieren al menos 3 columnas" });
            continue;
          }

          const type = cols[0] || "persona_natural";
          if (!["persona_natural", "persona_juridica", "institucion"].includes(type)) {
            result.errors++;
            result.errorRows.push({ row: i + 1, error: `Tipo inválido: ${type}` });
            continue;
          }

          await createContact(firmId, {
            type,
            firstName: cols[1] || undefined,
            lastName: cols[2] || undefined,
            email: cols[3] || undefined,
            phone: cols[4] || undefined,
            identityNumber: cols[5] || undefined,
          });
          result.imported++;
        } catch (err) {
          result.errors++;
          result.errorRows.push({ row: i + 1, error: err instanceof Error ? err.message : "Error desconocido" });
        }
      }
    } else if (entityType === "cases") {
      for (let i = 1; i < lines.length; i++) {
        try {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 4) {
            result.errors++;
            result.errorRows.push({ row: i + 1, error: "Fila inválida: se requieren al menos 4 columnas" });
            continue;
          }

          const matter = cols[2] || "civil";
          const validMatters = ["civil", "penal", "laboral", "familia", "mercantil", "contencioso", "constitucional"];

          if (!validMatters.includes(matter)) {
            result.errors++;
            result.errorRows.push({ row: i + 1, error: `Materia inválida: ${matter}` });
            continue;
          }

          await createCase(firmId, {
            number: cols[0],
            title: cols[1],
            matter,
            startDate: cols[5] || new Date().toISOString().split("T")[0],
          });
          result.imported++;
        } catch (err) {
          result.errors++;
          result.errorRows.push({ row: i + 1, error: err instanceof Error ? err.message : "Error desconocido" });
        }
      }
    }

    await writeAuditLog({
      firmId,
      action: "create",
      entityType: entityType === "contacts" ? "contact" : "case",
      changes: { method: "csv_import", imported: result.imported, errors: result.errors },
    });

    return NextResponse.json(result);
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error importing CSV:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al importar CSV" }, { status: 500 });
  }
}
