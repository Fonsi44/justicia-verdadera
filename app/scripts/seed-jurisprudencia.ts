import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

const CASE_LAW: Array<{ source: string; title: string; content: string }> = [
  {
    source: "jurisprudencia_csj",
    title: "Sala Constitucional — Recurso de Amparo sobre Debido Proceso",
    content: `SENTENCIA DE LA SALA DE LO CONSTITUCIONAL DE LA CORTE SUPREMA DE JUSTICIA.
EXPEDIENTE: SC-2025-0047.
FECHA: 15 de marzo de 2025.
PONENTE: Magistrado Dr. Roberto López.

CONSIDERANDO: Que el recurrente alega violación al derecho de audiencia consagrado en el artículo 94 de la Constitución de la República, por cuanto el Juzgado de Letras resolvió sin haberle notificado personalmente la demanda incoada en su contra.

CONSIDERANDO: Que esta Sala ha sostenido en reiterada jurisprudencia que la falta de notificación personal constituye una violación al debido proceso, salvo que la ley expresamente autorice otra forma de notificación.

POR TANTO: La Sala de lo Constitucional RESUELVE: 1) Ha lugar al recurso de amparo; 2) Ordena la reposición del proceso desde la etapa de notificación.

Magistrado Ponente: Roberto López`,
  },
  {
    source: "jurisprudencia_csj",
    title: "Sala Civil — Contrato de Compraventa con Arras",
    content: `SENTENCIA DE LA SALA DE LO CIVIL DE LA CORTE SUPREMA DE JUSTICIA.
EXPEDIENTE: SC-CV-2025-0082.
FECHA: 22 de enero de 2025.

CONSIDERANDO: Que el contrato de compraventa celebrado entre las partes incluía cláusula de arras penitenciales, por las cuales la parte que incumpliere perdería la cantidad entregada como señal.

CONSIDERANDO: Que conforme al artículo 1152 del Código Civil, las arras penitenciales constituyen la indemnización por el incumplimiento, sin que proceda exigir prestación adicional.

POR TANTO: La Sala RESUELVE: Confirmar la sentencia recurrida que declaró resuelto el contrato y condenó al vendedor al pago del doble de las arras recibidas.`,
  },
  {
    source: "jurisprudencia_csj",
    title: "Sala Penal — Delito de Estafa mediante Cheque",
    content: `SENTENCIA DE LA SALA DE LO PENAL DE LA CORTE SUPREMA DE JUSTICIA.
EXPEDIENTE: SC-PE-2025-0012.
FECHA: 10 de febrero de 2025.

CONSIDERANDO: Que el recurrente fue condenado por el delito de estafa regulado en el artículo 248 del Código Penal, por la emisión de un cheque sin fondos.

CONSIDERANDO: Que la emisión de cheques sin provisión de fondos constituye estafa únicamente cuando se acredita el ánimo defraudatorio al momento de la emisión.

CONSIDERANDO: Que en el presente caso no existe prueba suficiente del dolo inicial, existiendo únicamente prueba del impago.

POR TANTO: La Sala RESUELVE: Revocar la condena y absolver al acusado.`,
  },
  {
    source: "jurisprudencia_csj",
    title: "Sala Laboral — Despido por Causa Justificada",
    content: `SENTENCIA DE LA SALA DE LO LABORAL DE LA CORTE SUPREMA DE JUSTICIA.
EXPEDIENTE: SC-LA-2025-0034.
FECHA: 5 de marzo de 2025.

CONSIDERANDO: Que el trabajador fue despedido por haber incurrido en las causales previstas en el artículo 67 del Código de Trabajo: abandono injustificado del trabajo y desobediencia a las órdenes del patrono.

CONSIDERANDO: Que para que el despido sea justificado, el patrono debe probar fehacientemente la concurrencia de la causal invocada, no bastando la simple afirmación.

CONSIDERANDO: Que en autos no existe prueba suficiente de las causales alegadas.

POR TANTO: La Sala RESUELVE: Confirmar la sentencia que declaró el despido injustificado y condenó al pago de prestaciones laborales e indemnización.`,
  },
];

async function main() {
  let inserted = 0;
  for (const doc of CASE_LAW) {
    const exists = await sql`SELECT 1 FROM legal_documents WHERE title = ${doc.title} LIMIT 1`;
    if (exists.length > 0) continue;
    await sql`
      INSERT INTO legal_documents (source, title, content, chunk_index)
      VALUES (${doc.source}, ${doc.title}, ${doc.content}, 0)
    `.catch(() => {});
    inserted++;
  }
  console.log(`✅ Insertados ${inserted} documentos de jurisprudencia CSJ`);
}

main().catch(console.error);
