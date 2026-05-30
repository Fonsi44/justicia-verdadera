import { NextRequest, NextResponse } from "next/server";

function getContactsCSV(): string {
  const headers = "tipo,nombre,apellido,email,telefono,identidad";
  const example = "persona_natural,Juan,Pérez,juan@ejemplo.com,+50499990000,0801-1990-12345";
  return `${headers}\n${example}\n`;
}

function getCasesCSV(): string {
  const headers = "numero,titulo,materia,estado,cliente_email,fecha_inicio";
  const example = "CV-2026-0001,Demanda ejecutiva,civil,activo,juan@ejemplo.com,2026-01-15";
  return `${headers}\n${example}\n`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "contacts";

  const csv = type === "cases" ? getCasesCSV() : getContactsCSV();
  const filename = type === "cases" ? "plantilla-casos.csv" : "plantilla-contactos.csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
