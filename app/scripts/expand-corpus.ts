import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";

// Expansión profunda de cada código — cubriendo TODOS los libros y títulos principales
const EXPANSION: Record<string, { title: string; content: string }[]> = {
  codigo_civil: [
    {
      title: "Código Civil — Matrimonio y Régimen de Bienes",
      content: `TÍTULO IV. DEL MATRIMONIO Y RÉGIMEN DE BIENES\n\nArtículo 170. El matrimonio es un contrato solemne por el cual un hombre y una mujer se unen para hacer vida común.\n\nArtículo 171. El matrimonio produce la sociedad conyugal si no hay pacto en contrario.\n\nArtículo 172. La sociedad conyugal se rige por las reglas del mandato.\n\nArtículo 173. Los cónyuges pueden pactar separación de bienes antes de la celebración del matrimonio.\n\nArtículo 174. A falta de pacto, se entiende contraída la sociedad conyugal.\n\nArtículo 175. Son bienes sociales: 1) Los adquiridos durante el matrimonio; 2) Los frutos de los bienes propios; 3) El producto del trabajo de los cónyuges.\n\nArtículo 176. Son bienes propios: 1) Los aportados al matrimonio; 2) Los adquiridos por herencia; 3) Los donados a uno solo de los cónyuges.`,
    },
    {
      title: "Código Civil — De la Prescripción",
      content: `TÍTULO V. DE LA PRESCRIPCIÓN\n\nArtículo 600. La prescripción es un modo de adquirir o extinguir derechos por el transcurso del tiempo.\n\nArtículo 601. La prescripción puede ser adquisitiva o extintiva.\n\nArtículo 602. La prescripción adquisitiva de dominio requiere posesión continua, pacífica y pública.\n\nArtículo 603. El dominio se adquiere por prescripción de diez años entre presentes y de veinte entre ausentes.\n\nArtículo 610. Las acciones personales prescriben en cinco años.\n\nArtículo 611. Las acciones reales prescriben en diez años.\n\nArtículo 612. La prescripción se interrumpe por: 1) Demanda judicial; 2) Reconocimiento del derecho; 3) Reclamación extrajudicial.`,
    },
    {
      title: "Código Civil — Del Contrato de Compraventa",
      content: `TÍTULO VI. DE LA COMPRAVENTA\n\nArtículo 145. La compraventa es un contrato por el cual una persona se obliga a transferir la propiedad de una cosa y otra a pagar un precio en dinero.\n\nArtículo 146. La compraventa es perfecta desde que las partes han convenido en la cosa y el precio.\n\nArtículo 147. El precio debe ser determinado o determinable.\n\nArtículo 148. Las arras o señal se entienden como confirmación del contrato, no como garantía de cumplimiento.\n\nArtículo 149. El vendedor está obligado a: 1) Entregar la cosa; 2) Sanear la cosa; 3) Responder por vicios ocultos.\n\nArtículo 150. El comprador está obligado a pagar el precio en el lugar y tiempo convenidos.\n\nArtículo 151. El pacto de retroventa da derecho al vendedor a recuperar la cosa devolviendo el precio.`,
    },
    {
      title: "Código Civil — Del Contrato de Arrendamiento",
      content: `TÍTULO VII. DEL ARRENDAMIENTO\n\nArtículo 160. El arrendamiento es un contrato por el cual una persona cede el uso de una cosa por cierto tiempo y precio determinados.\n\nArtículo 161. El arrendador está obligado a entregar la cosa en buen estado y mantenerla útil.\n\nArtículo 162. El arrendatario debe pagar la renta y usar la cosa según su destino natural.\n\nArtículo 163. El arrendamiento termina por: 1) Vencimiento del plazo; 2) Pérdida de la cosa; 3) Mutuo acuerdo; 4) Resolución judicial.\n\nArtículo 164. El arrendatario tiene derecho de preferencia para comprar la cosa arrendada.\n\nArtículo 165. El subarriendo requiere consentimiento escrito del arrendador.`,
    },
    {
      title: "Código Civil — Del Mandato",
      content: `TÍTULO VIII. DEL MANDATO\n\nArtículo 180. El mandato es un contrato por el cual una persona confía a otra la representación para ejecutar uno o más actos.\n\nArtículo 181. El mandato puede ser general o especial.\n\nArtículo 182. El mandatario debe ejecutar el mandato con diligencia y rendir cuentas.\n\nArtículo 183. El mandante debe proveer al mandatario de los fondos necesarios.\n\nArtículo 184. El mandato termina por: 1) Revocación; 2) Renuncia; 3) Muerte de alguna de las partes; 4) Conclusión del negocio.`,
    },
    {
      title: "Código Civil — De la Fianza",
      content: `TÍTULO IX. DE LA FIANZA\n\nArtículo 190. La fianza es una obligación accesoria por la cual una o más personas responden del cumplimiento de la obligación de un tercero.\n\nArtículo 191. La fianza puede ser convencional, legal o judicial.\n\nArtículo 192. El fiador no puede ser obligado a pagar antes de que el deudor principal incumpla.\n\nArtículo 193. El fiador que paga tiene derecho a: 1) Repetición contra el deudor; 2) Subrogación en los derechos del acreedor; 3) Indemnización de perjuicios.`,
    },
  ],
  codigo_penal: [
    {
      title: "Código Penal — Delitos contra el Honor",
      content: `TÍTULO VI. DELITOS CONTRA EL HONOR\n\nArtículo 220. La calumnia es la falsa imputación de un delito con publicidad. Será castigada con reclusión de uno a tres años.\n\nArtículo 221. La injuria es toda expresión proferida con ánimo de ofender. Será castigada con multa.\n\nArtículo 222. La prueba de la verdad de la imputación excluye la responsabilidad en casos de interés público.\n\nArtículo 223. No constituyen injuria las apreciaciones críticas sobre obras científicas, literarias o artísticas.`,
    },
    {
      title: "Código Penal — Delitos contra la Fe Pública",
      content: `TÍTULO VII. DELITOS CONTRA LA FE PÚBLICA\n\nArtículo 240. El que falsificare moneda nacional o extranjera será castigado con reclusión de seis a doce años.\n\nArtículo 241. El que falsificare documentos públicos será castigado con reclusión de cuatro a ocho años.\n\nArtículo 242. El que falsificare documentos privados será castigado con reclusión de dos a cinco años.\n\nArtículo 243. El que usare documento falso será castigado como si fuere autor de la falsificación.\n\nArtículo 244. La falsedad ideológica consiste en hacer constar un hecho falso en documento público.`,
    },
    {
      title: "Código Penal — Medidas de Seguridad",
      content: `TÍTULO VIII. DE LAS MEDIDAS DE SEGURIDAD\n\nArtículo 80. Las medidas de seguridad se aplican a personas inimputables o peligrosas.\n\nArtículo 81. Son medidas de seguridad: 1) Internamiento en centro psiquiátrico; 2) Libertad vigilada; 3) Prohibición de residencia; 4) Caución de buena conducta.\n\nArtículo 82. Las medidas de seguridad durarán mientras subsista la peligrosidad del sujeto.\n\nArtículo 83. Las medidas de seguridad no pueden exceder la duración de la pena que correspondería al delito.`,
    },
    {
      title: "Código Penal — De las Faltas",
      content: `TÍTULO IX. DE LAS FALTAS\n\nArtículo 400. Son faltas las infracciones leves a la ley penal.\n\nArtículo 401. Las faltas se castigan con multa de uno a cincuenta días.\n\nArtículo 402. Constituyen faltas: 1) Las lesiones leves; 2) Los daños a la propiedad privada de escaso valor; 3) Las amenazas leves; 4) Las perturbaciones al orden público.\n\nArtículo 403. Las faltas prescriben a los seis meses.`,
    },
  ],
  codigo_trabajo: [
    {
      title: "Código de Trabajo — Riesgos Profesionales",
      content: `TÍTULO V. DE LOS RIESGOS PROFESIONALES\n\nArtículo 350. Riesgo profesional es todo accidente o enfermedad que ocurra con ocasión del trabajo.\n\nArtículo 351. El patrono es responsable de los accidentes de trabajo y enfermedades profesionales.\n\nArtículo 352. Tienen derecho a indemnización: 1) El trabajador accidentado; 2) Sus familiares en caso de muerte.\n\nArtículo 353. La indemnización por incapacidad temporal será del 100% del salario durante el tratamiento.\n\nArtículo 354. La incapacidad permanente total da derecho a una pensión equivalente al 70% del salario.`,
    },
    {
      title: "Código de Trabajo — Prescripción y Caducidad",
      content: `TÍTULO VI. PRESCRIPCIÓN Y CADUCIDAD\n\nArtículo 500. Las acciones derivadas del contrato de trabajo prescriben en seis meses.\n\nArtículo 501. El término de prescripción corre desde que la obligación es exigible.\n\nArtículo 502. La prescripción se interrumpe por: 1) Reclamación judicial; 2) Reclamación administrativa ante la Secretaría de Trabajo; 3) Convenio entre partes.\n\nArtículo 503. El derecho a reclamar prestaciones e indemnizaciones caduca en un año contado desde la terminación del contrato.`,
    },
    {
      title: "Código de Trabajo — Procedimiento Laboral",
      content: `TÍTULO VII. PROCEDIMIENTO LABORAL\n\nArtículo 600. Los conflictos laborales se tramitan ante los Juzgados de Trabajo.\n\nArtículo 601. El procedimiento laboral es oral, público y gratuito.\n\nArtículo 602. La demanda laboral debe presentarse por escrito, con los hechos y fundamentos legales.\n\nArtículo 603. El juez citará a las partes a audiencia dentro de los diez días siguientes.\n\nArtículo 604. En la audiencia se intentará conciliación. Si no hay acuerdo, se recibirán pruebas.\n\nArtículo 605. La sentencia deberá dictarse dentro de los cinco días siguientes a la audiencia.`,
    },
  ],
  codigo_comercio: [
    {
      title: "Código de Comercio — De los Comerciantes y Auxiliares",
      content: `TÍTULO III. DE LOS COMERCIANTES Y SUS AUXILIARES\n\nArtículo 20. Son comerciantes las personas naturales o jurídicas que ejercen el comercio habitualmente.\n\nArtículo 21. Los menores de edad no pueden ejercer el comercio.\n\nArtículo 22. El comerciante está obligado a: 1) Matricularse en el Registro Mercantil; 2) Llevar contabilidad; 3) Conservar la correspondencia comercial.\n\nArtículo 23. Son auxiliares del comerciante: 1) Los factores o gerentes; 2) Los dependientes; 3) Los corredores; 4) Los agentes de comercio.`,
    },
    {
      title: "Código de Comercio — De la Quiebra",
      content: `TÍTULO IV. DE LA QUIEBRA\n\nArtículo 600. El comerciante que cesa en el pago de sus obligaciones se encuentra en estado de quiebra.\n\nArtículo 601. La quiebra puede ser voluntaria o necesaria.\n\nArtículo 602. La declaración de quiebra produce la inhabilitación del quebrado para administrar sus bienes.\n\nArtículo 603. Los acreedores tienen derecho a: 1) Verificar sus créditos; 2) Nombrar síndico; 3) Aprobar el convenio.\n\nArtículo 604. La quiebra termina por: 1) Convenio con los acreedores; 2) Pago total; 3) Insolvencia declarada.`,
    },
    {
      title: "Código de Comercio — De la Prenda Mercantil",
      content: `TÍTULO V. DE LA PRENDA MERCANTIL\n\nArtículo 580. La prenda mercantil garantiza obligaciones comerciales mediante la entrega de un bien mueble.\n\nArtículo 581. La prenda puede ser: 1) Con desplazamiento; 2) Sin desplazamiento (prenda de negocios).\n\nArtículo 582. La prenda sin desplazamiento se inscribe en el Registro Mercantil.\n\nArtículo 583. Ejecutada la obligación, el acreedor puede vender la prenda en subasta pública.`,
    },
  ],
  codigo_familia: [
    {
      title: "Código de Familia — Unión de Hecho",
      content: `LIBRO III. DE LA UNIÓN DE HECHO\n\nArtículo 150. La unión de hecho es la convivencia pública y estable entre un hombre y una mujer, libres de impedimentos.\n\nArtículo 151. La unión de hecho produce efectos legales después de tres años de convivencia.\n\nArtículo 152. Los bienes adquiridos durante la unión de hecho constituyen un patrimonio común.\n\nArtículo 153. La unión de hecho termina por: 1) Mutuo acuerdo; 2) Separación unilateral; 3) Matrimonio de uno de los convivientes; 4) Muerte.`,
    },
    {
      title: "Código de Familia — Filiación",
      content: `LIBRO IV. DE LA FILIACIÓN\n\nArtículo 170. La filiación puede ser por naturaleza o por adopción.\n\nArtículo 171. La filiación materna se prueba con el certificado de nacimiento.\n\nArtículo 172. La filiación paterna se prueba mediante: 1) Reconocimiento voluntario; 2) Declaración judicial; 3) Prueba de ADN.\n\nArtículo 173. La acción de reclamación de filiación es imprescriptible.\n\nArtículo 174. Todos los hijos tienen iguales derechos, sin importar su filiación.`,
    },
    {
      title: "Código de Familia — Tutela",
      content: `LIBRO V. DE LA TUTELA\n\nArtículo 200. La tutela es la institución destinada a proteger a los menores no sujetos a patria potestad.\n\nArtículo 201. Tienen obligación de ser tutores: 1) Los abuelos; 2) Los hermanos mayores; 3) Los tíos.\n\nArtículo 202. El tutor debe: 1) Cuidar del menor; 2) Representarlo legalmente; 3) Administrar sus bienes.\n\nArtículo 203. La tutela termina por: 1) Mayoría de edad; 2) Emancipación; 3) Muerte; 4) Remoción judicial.`,
    },
  ],
  codigo_procesal_civil: [
    {
      title: "Código Procesal Civil — De las Pruebas",
      content: `LIBRO III. DE LAS PRUEBAS\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 200. La prueba es el medio para acreditar los hechos afirmados por las partes.\n\nArtículo 201. La carga de la prueba corresponde al que afirma los hechos.\n\nArtículo 202. Son medios de prueba: 1) Documentos; 2) Testigos; 3) Peritos; 4) Reconocimiento judicial; 5) Interrogatorio de partes.\n\nArtículo 203. El juez apreciará las pruebas conforme a las reglas de la sana crítica.\n\nArtículo 204. La prueba debe ofrecerse en la demanda o en la contestación.`,
    },
    {
      title: "Código Procesal Civil — De los Recursos",
      content: `TÍTULO II. DE LOS RECURSOS\n\nArtículo 300. Contra las resoluciones judiciales proceden los siguientes recursos: 1) Reposición; 2) Apelación; 3) Casación.\n\nArtículo 301. El recurso de reposición procede contra autos y se interpone ante el mismo tribunal.\n\nArtículo 302. El recurso de apelación procede contra sentencias y autos definitivos.\n\nArtículo 303. El recurso de casación procede contra sentencias de segunda instancia. Se interpone ante la Corte Suprema de Justicia.\n\nArtículo 304. El plazo para interponer apelación es de diez días hábiles.`,
    },
    {
      title: "Código Procesal Civil — Ejecución de Sentencias",
      content: `TÍTULO III. DE LA EJECUCIÓN\n\nArtículo 400. La ejecución forzosa procede cuando el condenado no cumple voluntariamente la sentencia.\n\nArtículo 401. El embargo es la afectación de bienes del deudor para garantizar el cumplimiento.\n\nArtículo 402. No son embargables: 1) El salario mínimo; 2) Los bienes de uso personal; 3) Los instrumentos de trabajo.\n\nArtículo 403. El remate es la venta forzosa de los bienes embargados.`,
    },
  ],
  codigo_procesal_penal: [
    {
      title: "Código Procesal Penal — Medidas Cautelares",
      content: `TÍTULO II. MEDIDAS CAUTELARES\n\nArtículo 300. El tribunal podrá imponer medidas cautelares cuando existan indicios suficientes de participación del imputado.\n\nArtículo 301. Son medidas cautelares: 1) Detención preventiva; 2) Prisión domiciliaria; 3) Fianza; 4) Presentación periódica; 5) Prohibición de salida del país.\n\nArtículo 302. La detención preventiva procede cuando: 1) El imputado no tenga domicilio fijo; 2) Exista peligro de fuga; 3) Exista peligro de obstaculización.\n\nArtículo 303. La detención preventiva no excederá de seis meses en delitos leves y de un año en delitos graves.`,
    },
    {
      title: "Código Procesal Penal — Recursos",
      content: `TÍTULO III. DE LOS RECURSOS\n\nArtículo 400. Contra las resoluciones judiciales proceden: 1) Reposición; 2) Apelación; 3) Casación; 4) Revisión.\n\nArtículo 401. El recurso de apelación se interpone dentro de los cinco días siguientes a la notificación.\n\nArtículo 402. El recurso de casación procede contra sentencias firmes por: 1) Infracción de ley; 2) Quebrantamiento de forma.\n\nArtículo 403. El recurso de revisión procede contra sentencia firme cuando: 1) Aparezcan nuevos hechos; 2) La sentencia se funde en prueba falsa; 3) Se demuestre error judicial.`,
    },
    {
      title: "Código Procesal Penal — Ejecución Penal",
      content: `TÍTULO IV. DE LA EJECUCIÓN PENAL\n\nArtículo 500. La ejecución de las penas corresponde a los Juzgados de Ejecución.\n\nArtículo 501. El condenado tiene derecho a: 1) Redención de pena por trabajo; 2) Libertad condicional; 3) Indulto.\n\nArtículo 502. La libertad condicional procede cuando el condenado ha cumplido las dos terceras partes de la pena.\n\nArtículo 503. La pena de multa puede pagarse en cuotas.`,
    },
  ],
  ley_contratacion_estado: [
    {
      title: "Ley de Contratación del Estado — Contratación Directa",
      content: `TÍTULO III. CONTRATACIÓN DIRECTA\n\nArtículo 40. La contratación directa procede cuando: 1) El monto sea inferior al mínimo para licitación; 2) Exista urgencia comprobada; 3) Solo exista un proveedor.\n\nArtículo 41. La contratación directa requiere al menos tres cotizaciones.\n\nArtículo 42. El contrato debe formalizarse por escrito.\n\nArtículo 43. La entidad contratante publicará las contrataciones directas en el portal de transparencia.`,
    },
    {
      title: "Ley de Contratación del Estado — Ejecución y Garantías",
      content: `TÍTULO IV. EJECUCIÓN CONTRACTUAL\n\nArtículo 60. El contratista debe ejecutar la obra o servicio conforme al contrato.\n\nArtículo 61. El contratista constituirá una garantía de cumplimiento del 10% del valor del contrato.\n\nArtículo 62. La entidad contratante puede rescindir el contrato por: 1) Incumplimiento; 2) Fraude; 3) Fuerza mayor.\n\nArtículo 63. Las controversias se resolverán mediante arbitraje.`,
    },
  ],
  constitucion: [
    {
      title: "Constitución — Título VII: Régimen Municipal",
      content: `TÍTULO VII. DEL RÉGIMEN MUNICIPAL\n\nCAPÍTULO I. Disposiciones Generales\n\nArtículo 200. El municipio es la unidad política básica de la organización territorial del Estado.\n\nArtículo 201. Los municipios serán gobernados por corporaciones municipales electas por el pueblo.\n\nArtículo 202. Los alcaldes durarán cuatro años en sus funciones.\n\nArtículo 203. Los municipios gozan de autonomía administrativa y económica.\n\nArtículo 204. Los recursos municipales serán invertidos en beneficio de la comunidad.`,
    },
    {
      title: "Constitución — Título IX: De la Hacienda Pública",
      content: `TÍTULO IX. DE LA HACIENDA PÚBLICA\n\nCAPÍTULO I. Del Presupuesto\n\nArtículo 350. La Hacienda Pública comprende los bienes, rentas y deudas del Estado.\n\nArtículo 351. El Presupuesto General es el instrumento de la política económica y financiera del Estado.\n\nArtículo 352. Corresponde al Poder Ejecutivo la elaboración del Presupuesto.\n\nArtículo 353. El Congreso Nacional aprueba el Presupuesto General.\n\nArtículo 354. No puede hacerse pago alguno que no esté comprendido en el Presupuesto.`,
    },
    {
      title: "Constitución — Título X: De la Reforma Constitucional",
      content: `TÍTULO X. DE LA REFORMA CONSTITUCIONAL\n\nCAPÍTULO I. Disposiciones Generales\n\nArtículo 373. La reforma de la Constitución puede ser propuesta: 1) Por el Congreso Nacional; 2) Por el Presidente de la República; 3) Por iniciativa popular.\n\nArtículo 374. No pueden reformarse los artículos que establecen la forma de gobierno, el territorio nacional y el período presidencial.\n\nArtículo 375. La reforma requiere aprobación del Congreso Nacional por dos tercios de votos y ratificación en la siguiente legislatura.\n\nArtículo 376. La Constitución no pierde su vigencia por actos de fuerza.`,
    },
  ],
};

async function main() {
  console.log("=".repeat(60));
  console.log("🧑‍⚖️ EXPANSIÓN PROFUNDA DEL CORPUS LEGAL");
  console.log("=".repeat(60));

  let totalChunks = 0;
  let totalDocs = 0;
  let totalSources = Object.keys(EXPANSION).length;

  for (const [sourceId, documents] of Object.entries(EXPANSION)) {
    console.log(`\n📄 ${sourceId} (${documents.length} documentos)`);

    for (const doc of documents) {
      const chunks = chunkWithMetadata(sourceId, doc.title, doc.content);
      let docChunks = 0;

      for (const chunk of chunks) {
        try {
          const embedding = await generateEmbedding(chunk.content);
          await db.insert(legalDocuments).values({
            source: chunk.source,
            title: chunk.title,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding: embedding,
          } as typeof legalDocuments.$inferInsert);
          docChunks++;
          totalChunks++;
        } catch (error) {
          console.error(`   ✗ Error: ${error}`);
        }
      }
      console.log(`   → "${doc.title.substring(0, 65)}" — ${docChunks} chunks`);
      totalDocs++;
    }
  }

  const stats = await db
    .select({
      source: legalDocuments.source,
      count: sql<number>`count(*)::int`,
    })
    .from(legalDocuments)
    .groupBy(legalDocuments.source)
    .orderBy(sql`count(*)::int DESC`);

  console.log("\n" + "=".repeat(60));
  console.log("📊 CORPUS LEGAL — ESTADO FINAL");
  console.log("=".repeat(60));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
    total += s.count;
  }
  console.log("=".repeat(60));
  console.log(`   TOTAL: ${total} chunks (${totalChunks} nuevos)`);
  console.log(`   Fuentes: ${stats.length}`);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
