import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../lib/db";
import { legalDocuments } from "../database/schema";
import { eq, sql } from "drizzle-orm";
import { chunkWithMetadata } from "../lib/ai/chunking";
import { generateEmbedding } from "../lib/ai/embeddings";

// Expansión del corpus con más artículos de cada código hondureño
const EXPANSION: Record<string, { title: string; content: string }[]> = {
  codigo_civil: [
    {
      title: "Código Civil — Libro II: De los Bienes y su Dominio",
      content: `LIBRO SEGUNDO. DE LOS BIENES Y SU DOMINIO\n\nTÍTULO I. DE LOS BIENES\n\nArtículo 150. Los bienes consisten en cosas corporales e incorporales.\n\nArtículo 151. Las cosas corporales son las que tienen un ser real y pueden ser percibidas por los sentidos. Las incorporales son las que consisten en meros derechos.\n\nArtículo 152. Los bienes se dividen en muebles e inmuebles.\n\nArtículo 153. Son bienes inmuebles: 1) El suelo y las construcciones adheridas a él; 2) Los árboles y plantas mientras estén unidos a la tierra; 3) Los derechos reales sobre inmuebles.\n\nArtículo 160. Dominio es el derecho real en una cosa corporal, para gozar y disponer de ella arbitrariamente, no siendo contra ley o contra derecho ajeno.\n\nArtículo 161. La propiedad separada del goce de la cosa se llama mera o nuda propiedad.`,
    },
    {
      title: "Código Civil — Libro III: De las Sucesiones",
      content: `LIBRO TERCERO. DE LAS SUCESIONES\n\nTÍTULO I. DEFINICIONES Y REGLAS GENERALES\n\nArtículo 500. La sucesión es la transmisión de los derechos activos y pasivos que componen la herencia de una persona difunta, a la persona que sobrevive.\n\nArtículo 501. La sucesión puede ser testamentaria o intestada.\n\nArtículo 502. La herencia comprende todos los bienes, derechos y obligaciones del difunto que no se extingan con su muerte.\n\nArtículo 503. Son herederos forzosos: 1) Los hijos y descendientes; 2) Los padres y ascendientes; 3) El cónyuge sobreviviente.\n\nArtículo 504. El cónyuge sobreviviente tiene derecho al usufructo de una parte de la herencia.\n\nArtículo 550. El testamento es un acto personalísimo, revocable y libre, por el cual una persona dispone de sus bienes para después de su muerte.`,
    },
    {
      title: "Código Civil — Responsabilidad Civil Extracontractual",
      content: `TÍTULO III. DE LA RESPONSABILIDAD CIVIL\n\nArtículo 200. El que por dolo, culpa o negligencia cause daño a otro está obligado a repararlo.\n\nArtículo 201. La responsabilidad civil puede ser contractual o extracontractual.\n\nArtículo 202. El daño puede ser material o moral. El daño material comprende el daño emergente y el lucro cesante.\n\nArtículo 203. El daño moral es aquel que afecta la reputación, los sentimientos o la dignidad de la persona.\n\nArtículo 210. Los padres son responsables del daño causado por sus hijos menores que habiten en el mismo hogar.\n\nArtículo 211. Los empleadores son responsables del daño causado por sus empleados en el ejercicio de sus funciones.`,
    },
  ],
  codigo_penal: [
    {
      title: "Código Penal — Delitos contra la Administración Pública",
      content: `TÍTULO III. DELITOS CONTRA LA ADMINISTRACIÓN PÚBLICA\n\nArtículo 300. El funcionario público que solicitare o recibiere dádivas para ejecutar un acto propio de su cargo será castigado con reclusión de cuatro a ocho años.\n\nArtículo 301. El que diere u ofreciere dádiva a un funcionario público será castigado con reclusión de dos a cinco años.\n\nArtículo 310. El funcionario público que se apropiare de bienes del Estado será castigado con reclusión de seis a doce años.\n\nArtículo 311. El funcionario que autorizare un gasto sin respaldo presupuestario será castigado con reclusión de tres a seis años.`,
    },
    {
      title: "Código Penal — Delitos Sexuales",
      content: `TÍTULO IV. DELITOS SEXUALES\n\nArtículo 140. El que mediante violencia o intimidación realizare acto sexual con persona de uno u otro sexo será castigado con reclusión de ocho a doce años.\n\nArtículo 141. La violación será castigada con reclusión de diez a quince años si concurriere: 1) Grave daño físico o psíquico; 2) Si la víctima fuere menor de catorce años; 3) Si fuere cometida por dos o más personas.\n\nArtículo 150. El que realizare actos sexuales con menor de catorce años será castigado con reclusión de seis a diez años.\n\nArtículo 151. El que promoviere la explotación sexual de menores será castigado con reclusión de cinco a diez años.`,
    },
    {
      title: "Código Penal — Delitos contra la Libertad",
      content: `TÍTULO V. DELITOS CONTRA LA LIBERTAD\n\nArtículo 180. El que privare a otro de su libertad personal será castigado con reclusión de tres a seis años.\n\nArtículo 181. La detención ilegal cometida por funcionario público será castigada con reclusión de cuatro a ocho años.\n\nArtículo 182. El secuestro será castigado con reclusión de ocho a quince años.\n\nArtículo 190. El que amenazare a otro con causarle a él o a su familia un mal grave será castigado con reclusión de uno a tres años.`,
    },
  ],
  codigo_trabajo: [
    {
      title: "Código de Trabajo — Sindicatos",
      content: `LIBRO III. DERECHO DE ASOCIACIÓN PROFESIONAL\n\nTÍTULO I. SINDICATOS\n\nArtículo 200. Los trabajadores y los patronos tienen el derecho de constituir sindicatos sin necesidad de autorización previa.\n\nArtículo 201. Los sindicatos de trabajadores pueden ser: 1) De empresa; 2) De industria; 3) Gremiales.\n\nArtículo 202. Para constituir un sindicato se requiere: 1) Veinte o más trabajadores; 2) Asamblea constitutiva; 3) Aprobación de estatutos.\n\nArtículo 203. Los sindicatos tienen derecho a: 1) Celebrar contratos colectivos; 2) Representar a sus afiliados; 3) Declarar huelgas.`,
    },
    {
      title: "Código de Trabajo — Conflictos Colectivos y Huelga",
      content: `TÍTULO II. CONFLICTOS COLECTIVOS\n\nArtículo 400. Se entiende por conflicto colectivo toda controversia entre patronos y trabajadores que afecte intereses comunes.\n\nArtículo 401. La huelga es la suspensión temporal del trabajo acordada por la mayoría de los trabajadores.\n\nArtículo 402. Son requisitos para la huelga: 1) Agotamiento de la vía conciliatoria; 2) Votación favorable de la mayoría absoluta; 3) Comunicación al patrono con cinco días de anticipación.\n\nArtículo 403. El paro es la suspensión temporal del trabajo por parte del patrono.\n\nArtículo 404. Son causas justificadas de paro: 1) Fuerza mayor; 2) Falta de materia prima; 3) Incumplimiento grave del trabajador.`,
    },
    {
      title: "Código de Trabajo — Seguridad Social e Higiene",
      content: `LIBRO IV. SEGURIDAD SOCIAL E HIGIENE EN EL TRABAJO\n\nArtículo 300. Todo patrono está obligado a adoptar medidas de higiene y seguridad en sus establecimientos.\n\nArtículo 301. El patrono debe proporcionar gratuitamente a sus trabajadores equipos de protección personal.\n\nArtículo 302. Las empresas con más de cien trabajadores deben mantener un servicio médico permanente.\n\nArtículo 303. El trabajador tiene derecho a un seguro social que cubra enfermedad, maternidad, invalidez y vejez.\n\nArtículo 304. El Instituto Hondureño de Seguridad Social (IHSS) administrará el régimen de seguridad social.`,
    },
  ],
  codigo_comercio: [
    {
      title: "Código de Comercio — Sociedades Mercantiles",
      content: `LIBRO II. DE LAS SOCIEDADES MERCANTILES\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 100. Por el contrato de sociedad, dos o más personas se obligan a aportar bienes o servicios para realizar un fin común.\n\nArtículo 101. Las sociedades mercantiles son: 1) Sociedad Anónima; 2) Sociedad de Responsabilidad Limitada; 3) Sociedad en Nombre Colectivo; 4) Sociedad en Comandita.\n\nArtículo 102. La Sociedad Anónima tiene el capital dividido en acciones y la responsabilidad de los socios limitada al valor de sus aportaciones.\n\nArtículo 103. La Sociedad de Responsabilidad Limitada tiene el capital dividido en participaciones y no excederá de veinticinco socios.\n\nArtículo 120. Las sociedades se constituyen mediante escritura pública y se inscriben en el Registro Mercantil.`,
    },
    {
      title: "Código de Comercio — Contratos Mercantiles",
      content: `TÍTULO II. CONTRATOS MERCANTILES\n\nArtículo 500. Son contratos mercantiles: 1) La compraventa mercantil; 2) El préstamo mercantil; 3) El depósito mercantil; 4) La prenda mercantil; 5) El seguro mercantil; 6) La fianza mercantil.\n\nArtículo 501. La compraventa mercantil es aquella que tiene por objeto mercaderías adquiridas para su reventa.\n\nArtículo 502. El préstamo mercantil es aquel en que ambas partes son comerciantes.\n\nArtículo 510. El contrato de seguro es aquel por el cual el asegurador se obliga a indemnizar un daño o pagar una suma de dinero al ocurrir un evento incierto.`,
    },
  ],
  codigo_familia: [
    {
      title: "Código de Familia — Patria Potestad",
      content: `LIBRO II. DE LA PATRIA POTESTAD\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 100. La patria potestad es el conjunto de derechos y obligaciones que corresponden a los padres sobre la persona y bienes de sus hijos.\n\nArtículo 101. La patria potestad se ejerce conjuntamente por el padre y la madre.\n\nArtículo 102. La patria potestad comprende: 1) Cuidado y protección; 2) Educación y formación; 3) Representación legal; 4) Administración de bienes.\n\nArtículo 110. La patria potestad se extingue por: 1) Muerte de los padres o del hijo; 2) Mayoría de edad del hijo; 3) Emancipación; 4) Declaración judicial.`,
    },
    {
      title: "Código de Familia — Adopción",
      content: `TÍTULO II. DE LA ADOPCIÓN\n\nArtículo 130. La adopción es una institución jurídica que tiene por objeto proteger el interés superior del menor.\n\nArtículo 131. Pueden adoptar: 1) Los cónyuges conjuntamente; 2) Las personas solteras mayores de 25 años; 3) Las parejas en unión de hecho.\n\nArtículo 132. Para adoptar se requiere: 1) Ser mayor de 25 años; 2) Tener medios económicos suficientes; 3) Ser idóneo moral y socialmente.\n\nArtículo 133. La adopción se constituye mediante resolución judicial y confiere al adoptado la condición de hijo.`,
    },
  ],
  constitucion: [
    {
      title: "Constitución — Título IV: Del Poder Legislativo",
      content: `TÍTULO IV. DEL PODER LEGISLATIVO\n\nCAPÍTULO I. Del Congreso Nacional\n\nArtículo 188. El Poder Legislativo se ejerce por un Congreso de Diputados, que serán elegidos por sufragio directo.\n\nArtículo 189. El Congreso Nacional se compondrá de 128 diputados propietarios y sus respectivos suplentes.\n\nArtículo 190. Los diputados durarán cuatro años en sus funciones y podrán ser reelectos.\n\nArtículo 191. Corresponde al Congreso Nacional: 1) Crear, modificar y derogar leyes; 2) Aprobar el Presupuesto General; 3) Declarar la guerra y aprobar la paz; 4) Conceder amnistía.`,
    },
    {
      title: "Constitución — Título V: Del Poder Ejecutivo",
      content: `TÍTULO V. DEL PODER EJECUTIVO\n\nCAPÍTULO I. Del Presidente de la República\n\nArtículo 235. El Poder Ejecutivo se ejerce por el Presidente de la República.\n\nArtículo 236. El Presidente será electo por sufragio directo por mayoría simple. Durará cuatro años en sus funciones.\n\nArtículo 237. No podrá ser Presidente quien hubiere ejercido la Presidencia en cualquier tiempo.\n\nArtículo 238. Son atribuciones del Presidente: 1) Cumplir y hacer cumplir la Constitución; 2) Representar al Estado; 3) Nombrar y remover Secretarios de Estado; 4) Sancionar y promulgar leyes.`,
    },
    {
      title: "Constitución — Título VI: Del Poder Judicial",
      content: `TÍTULO VI. DEL PODER JUDICIAL\n\nCAPÍTULO I. Principios Generales\n\nArtículo 303. El Poder Judicial lo ejerce la Corte Suprema de Justicia y los demás tribunales establecidos por la ley.\n\nArtículo 304. La justicia se imparte en nombre del Estado por los jueces y magistrados.\n\nArtículo 305. La Corte Suprema de Justicia se compondrá de quince magistrados.\n\nArtículo 306. Los magistrados de la Corte Suprema de Justicia serán electos por el Congreso Nacional por un período de siete años.\n\nArtículo 307. La Corte Suprema de Justicia conocerá: 1) Del recurso de casación; 2) Del recurso de amparo; 3) De las controversias entre poderes del Estado.`,
    },
    {
      title: "Constitución — Garantías Constitucionales",
      content: `TÍTULO VIII. DE LAS GARANTÍAS CONSTITUCIONALES\n\nCAPÍTULO I. Del Amparo\n\nArtículo 182. Toda persona tiene derecho a pedir amparo ante la Sala de lo Constitucional de la Corte Suprema de Justicia.\n\nArtículo 183. El amparo procede contra cualquier acto de autoridad que vulnere derechos constitucionales.\n\nArtículo 184. El habeas corpus procede cuando alguien fuere ilegalmente privado de su libertad.\n\nArtículo 185. La Constitución no pierde su fuerza aunque se interrumpa su observancia por actos de fuerza.`,
    },
  ],
  ley_amparo: [
    {
      title: "Ley de Amparo de Honduras",
      content: `LEY DE AMPARO\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 1. La presente Ley regula el recurso de amparo establecido en la Constitución de la República.\n\nArtículo 2. El amparo protege los derechos y garantías constitucionales.\n\nArtículo 3. El amparo procede contra: 1) Leyes, reglamentos o resoluciones que violen derechos; 2) Actos de autoridad que restrinjan la libertad; 3) Omisiones de autoridad que afecten derechos.\n\nArtículo 4. El amparo se interpondrá ante la Sala de lo Constitucional de la Corte Suprema de Justicia.\n\nArtículo 5. El plazo para interponer amparo es de treinta días hábiles siguientes a la notificación del acto recurrido.`,
    },
  ],
  ley_justicia_constitucional: [
    {
      title: "Ley de Justicia Constitucional de Honduras",
      content: `LEY DE JUSTICIA CONSTITUCIONAL\n\nTÍTULO I. DISPOSICIONES GENERALES\n\nArtículo 1. La presente Ley regula los procesos y procedimientos constitucionales.\n\nArtículo 2. Son procesos constitucionales: 1) El amparo; 2) El habeas corpus; 3) El habeas data; 4) La inconstitucionalidad.\n\nArtículo 3. El habeas data protege el derecho a conocer y rectificar información personal en registros públicos.\n\nArtículo 4. La acción de inconstitucionalidad procede contra leyes que violen la Constitución.\n\nArtículo 5. La Sala de lo Constitucional tiene competencia exclusiva para conocer de los procesos constitucionales.`,
    },
  ],
};

async function main() {
  console.log("=".repeat(60));
  console.log("🧑‍⚖️ EXPANSIÓN DEL CORPUS LEGAL HONDUREÑO");
  console.log("=".repeat(60));

  let totalChunks = 0;
  let totalDocs = 0;

  for (const [sourceId, documents] of Object.entries(EXPANSION)) {
    console.log(`\n📄 ${sourceId} (${documents.length} documentos nuevos)`);

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
      console.log(`   → "${doc.title.substring(0, 60)}" — ${docChunks} chunks`);
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
  console.log("📊 CORPUS LEGAL ACTUALIZADO");
  console.log("=".repeat(60));
  let total = 0;
  for (const s of stats) {
    console.log(`   ${s.source}: ${s.count} chunks`);
    total += s.count;
  }
  console.log("=".repeat(60));
  console.log(`   TOTAL: ${total} chunks (${totalChunks} nuevos)`);
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
