import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import { AppError } from "@/lib/errors";
import { getDocumentById } from "@/lib/services/documents.service";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateLegalHtml(
  title: string,
  content: string,
  caseNumber: string | null | undefined,
  documentDate: string,
): string {
  const formattedDate = new Date(documentDate).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines = content.split("\n").filter(Boolean);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { margin: 2.5cm 3cm 2.5cm 3cm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    margin: 0;
    padding: 2.5cm 3cm;
    color: #000;
  }
  .membrete {
    text-align: center;
    margin-bottom: 2cm;
    border-bottom: 2px solid #000;
    padding-bottom: 0.8cm;
  }
  .membrete .escudo {
    font-size: 28pt;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .membrete .pais {
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 4px;
  }
  .membrete .organismo {
    font-size: 11pt;
    margin-top: 4px;
  }
  .encabezado {
    margin-bottom: 1.5cm;
  }
  .encabezado p {
    margin: 2px 0;
  }
  .numero-expediente {
    text-align: right;
    font-weight: bold;
    margin-bottom: 1cm;
  }
  .titulo-documento {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 1cm;
  }
  .contenido p {
    text-align: justify;
    margin: 6px 0;
    text-indent: 1.5cm;
  }
  .contenido p.no-indent {
    text-indent: 0;
  }
  .firma {
    margin-top: 2.5cm;
    text-align: center;
  }
  .firma .linea {
    width: 50%;
    border-top: 1px solid #000;
    margin: 0 auto 0.5cm auto;
  }
  .page-number {
    text-align: center;
    font-size: 10pt;
    margin-top: 1cm;
    color: #555;
  }
  .numeracion-articulo {
    margin-left: 1cm;
  }
  @media print {
    body { padding: 0; }
    .page-break { page-break-before: always; }
  }
</style>
</head>
<body>

<div class="membrete">
  <div class="escudo">⚖</div>
  <div class="pais">República de Honduras</div>
  <div class="organismo">Poder Judicial de Honduras</div>
</div>

${caseNumber ? `<div class="numero-expediente">Expediente No. ${escapeHtml(caseNumber)}</div>` : ""}

<div class="titulo-documento">${escapeHtml(title)}</div>

<div class="encabezado">
  <p><strong>Comparecencia:</strong> _________________________________________</p>
  <p><strong>Abogado Director:</strong> _________________________________________</p>
  <p><strong>Correo Electrónico:</strong> _________________________________________</p>
  <p><strong>Teléfono:</strong> _________________________________________</p>
  <p class="no-indent"><strong>Lugar y Fecha:</strong> Tegucigalpa, M.D.C., ${formattedDate}</p>
</div>

<div class="contenido">
${lines.map((line) => {
  const trimmed = line.trim();
  if (!trimmed) return "";
  if (/^\d+[\.\)]/.test(trimmed)) {
    return `<p class="no-indent"><strong>${escapeHtml(trimmed)}</strong></p>`;
  }
  return `<p>${escapeHtml(trimmed)}</p>`;
}).join("\n")}
</div>

<div class="firma">
  <div class="linea"></div>
  <p><strong>Firma del Abogado</strong></p>
  <p>_________________________________________</p>
  <p>Nombre del Abogado</p>
  <p>Correo Electrónico</p>
  <p>Teléfono</p>
</div>

<div class="page-number">Página 1 de 1</div>

</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const firmId = await getFirmId();
    const { id } = await params;

    const doc = await getDocumentById(firmId, id);

    const content = doc.ocrText ?? "El documento no tiene contenido textual disponible.";
    const caseNumber = doc.case?.number ?? null;

    const html = generateLegalHtml(
      doc.name,
      content,
      caseNumber,
      doc.createdAt.toISOString(),
    );

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${doc.name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, "_")}.html"`,
      },
    });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError) return NextResponse.json(error.toJSON(), { status: error.status });
    console.error("Error generating PDF:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Error al generar el documento" }, { status: 500 });
  }
}
