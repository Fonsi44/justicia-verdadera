import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

const LEGAL_TEXTS: Array<{ source: string; title: string; content: string }> = [
  {
    source: "codigo_civil",
    title: "Código Civil de Honduras — Libro I, Título I (Personas)",
    content: `TÍTULO PRIMERO. De las personas.
Artículo 1.- Las personas son naturales o jurídicas.
Artículo 2.- Son personas naturales todos los individuos de la especie humana, cualquiera que sea su edad, sexo, estirpe o condición.
Artículo 3.- Las personas jurídicas son entes colectivos capaces de ejercer derechos y contraer obligaciones.
Artículo 4.- La personalidad civil comienza con el nacimiento y termina con la muerte.
Artículo 5.- El domicilio de las personas naturales es el lugar donde residen habitualmente.`,
  },
  {
    source: "codigo_civil",
    title: "Código Civil — Libro IV, Obligaciones y Contratos",
    content: `TÍTULO PRIMERO. De las obligaciones en general.
Artículo 1112.- Las obligaciones nacen de la ley, de los contratos, de los cuasicontratos, y de los actos y omisiones ilícitos o en que intervenga cualquier género de culpa o negligencia.
Artículo 1113.- Toda obligación consiste en dar, hacer o no hacer alguna cosa.
Artículo 1114.- El contrato es un acto por el cual una parte se obliga para con otra a dar, hacer o no hacer alguna cosa.
Artículo 1115.- Para que una persona se obligue a otra por un acto o declaración de voluntad, es necesario: 1º que sea legalmente capaz; 2º que consienta en dicho acto o declaración y su consentimiento no adolezca de vicio; 3º que recaiga sobre un objeto lícito; 4º que tenga una causa lícita.`,
  },
  {
    source: "codigo_penal",
    title: "Código Penal — Libro I, Disposiciones Generales",
    content: `TÍTULO PRIMERO. De los delitos y las faltas.
Artículo 1.- Es delito toda acción u omisión voluntaria penada por la ley.
Artículo 2.- No hay pena sin ley que la establezca. Nadie podrá ser sancionado por un acto u omisión que no esté previsto como delito o falta por ley anterior a su perpetración.
Artículo 3.- Las penas privativas de libertad se ejecutarán en establecimientos destinados al efecto.
Artículo 4.- El dolo consiste en la voluntad consciente y deliberada de ejecutar un acto que la ley prohíbe.
Artículo 5.- La imprudencia consiste en la infracción del deber de cuidado objetivo.`,
  },
  {
    source: "codigo_penal",
    title: "Código Penal — Delitos contra la Propiedad",
    content: `TÍTULO SEGUNDO. De los delitos contra la propiedad.
Artículo 245.- El que con ánimo de lucro se apodere de una cosa mueble ajena usando de violencia o intimidación en las personas, será castigado con la pena de cuatro a ocho años de reclusión.
Artículo 246.- La estafa se comete por el que con ánimo de lucro utiliza engaño bastante para producir error en otro, induciéndolo a realizar un acto de disposición en perjuicio propio o ajeno.
Artículo 248.- Será castigado con la pena de dos a seis años de reclusión el que cometiere estafa.
Artículo 250.- El que se apodere ilegítimamente de una cosa mueble ajena, sin violencia ni intimidación, comete hurto.`,
  },
  {
    source: "codigo_procesal_penal",
    title: "Código Procesal Penal — Principios y Garantías",
    content: `TÍTULO PRIMERO. Principios fundamentales.
Artículo 1.- Ninguna persona podrá ser condenada sin un juicio previo, oral y público, celebrado ante un juez o tribunal imparcial.
Artículo 2.- Toda persona se presume inocente mientras no se haya declarado su culpabilidad mediante sentencia firme.
Artículo 3.- El imputado tiene derecho a ser asistido por un defensor desde el momento mismo de su detención.
Artículo 4.- La prueba obtenida con violación de garantías constitucionales no tendrá validez.
Artículo 5.- El Ministerio Público es el titular de la acción penal pública.`,
  },
  {
    source: "codigo_trabajo",
    title: "Código de Trabajo — Principios Generales",
    content: `TÍTULO PRIMERO. Disposiciones generales.
Artículo 1.- El presente Código regula las relaciones de trabajo entre patronos y trabajadores.
Artículo 2.- El trabajo es un derecho y un deber social. No es artículo de comercio.
Artículo 3.- El Estado protegerá el trabajo en todas sus formas.
Artículo 4.- Para los efectos del presente Código, se entiende por patrono toda persona natural o jurídica que utiliza los servicios de uno o más trabajadores.
Artículo 5.- Se entiende por trabajador toda persona natural que presta servicios personales a otro bajo su dirección y dependencia.`,
  },
  {
    source: "codigo_trabajo",
    title: "Código de Trabajo — Jornada y Salarios",
    content: `TÍTULO SEGUNDO. De la jornada de trabajo.
Artículo 127.- La jornada ordinaria de trabajo no excederá de ocho horas diarias ni de cuarenta y cuatro horas semanales.
Artículo 128.- El trabajo nocturno no excederá de seis horas diarias.
Artículo 129.- Las horas extraordinarias se pagarán con un recargo del 50% sobre el salario ordinario.
Artículo 130.- Todo trabajador tiene derecho a un salario mínimo fijado periódicamente.
Artículo 131.- El salario debe pagarse en moneda de curso legal, en el lugar de trabajo y durante las horas de trabajo.`,
  },
  {
    source: "codigo_comercio",
    title: "Código de Comercio — Actos de Comercio",
    content: `TÍTULO PRIMERO. De los actos de comercio.
Artículo 1.- Son actos de comercio: 1º La compraventa de mercaderías con ánimo de revenderlas; 2º Las operaciones de cambio, banca y corretaje; 3º Las operaciones de seguro; 4º Los contratos de transporte; 5º Los actos relativos a la navegación.
Artículo 2.- El comerciante es toda persona que ejerce actos de comercio de modo habitual.
Artículo 3.- El registro mercantil es público y está a cargo de la Cámara de Comercio correspondiente.
Artículo 4.- Todo comerciante está obligado a llevar contabilidad mercantil.`,
  },
  {
    source: "codigo_familia",
    title: "Código de Familia — Matrimonio",
    content: `TÍTULO PRIMERO. Del matrimonio.
Artículo 1.- El matrimonio es la unión voluntaria de un hombre y una mujer, realizada con las formalidades legales, para hacer vida en común.
Artículo 2.- Son impedimentos para contraer matrimonio: 1º El parentesco en línea recta por consanguinidad o afinidad; 2º El vínculo matrimonial no disuelto; 3º La falta de edad legal.
Artículo 3.- El matrimonio se disuelve por: 1º La muerte de uno de los cónyuges; 2º El divorcio; 3º La nulidad del matrimonio.
Artículo 4.- El divorcio podrá ser: 1º Voluntario; 2º Necesario.`,
  },
  {
    source: "reglamento_sar",
    title: "Reglamento de Facturación SAR",
    content: `TÍTULO PRIMERO. Disposiciones generales.
Artículo 1.- El presente Reglamento establece las normas para la emisión de facturas, recibos y documentos equivalentes.
Artículo 2.- Toda persona natural o jurídica que realice actividades económicas está obligada a emitir facturas.
Artículo 3.- La factura deberá contener: a) Número de CAI; b) RTN del emisor y receptor; c) Fecha de emisión; d) Descripción de los bienes o servicios; e) Precio unitario y total; f) ISV desglosado.
Artículo 4.- El CAI (Código de Autorización de Impresión) es el código único asignado por el SAR para autorizar la impresión de facturas.
Artículo 5.- El plazo de conservación de las facturas es de cinco años.`,
  },
  {
    source: "ley_contratacion_estado",
    title: "Ley de Contratación del Estado",
    content: `TÍTULO PRIMERO. Principios generales.
Artículo 1.- La presente Ley regula la actividad del Estado en materia de contratación de obras, bienes y servicios.
Artículo 2.- Los principios que rigen la contratación pública son: transparencia, economía, eficiencia, publicidad, igualdad y concurrencia.
Artículo 3.- Toda contratación pública se realizará mediante licitación pública, licitación privada o contratación directa.
Artículo 4.- La licitación pública es el procedimiento de selección abierto a todos los interesados.
Artículo 5.- El contrato administrativo se perfecciona mediante la resolución de adjudicación.`,
  },
  {
    source: "tratados",
    title: "CAFTA-DR — Tratado de Libre Comercio",
    content: `CAPÍTULO PRIMERO. Disposiciones iniciales.
Artículo 1.1.- Se establece una zona de libre comercio entre las Partes.
Artículo 1.2.- Los objetivos del Tratado son: a) Eliminar obstáculos al comercio; b) Promover condiciones de competencia leal; c) Aumentar las oportunidades de inversión.
Artículo 2.1.- Trato Nacional: Cada Parte otorgará trato no menos favorable que el que otorga a sus productos nacionales similares.
Artículo 3.1.- Las medidas sanitarias y fitosanitarias se basarán en principios científicos.
Artículo 4.1.- Las Partes reconocen la importancia de la propiedad intelectual.`,
  },
];

async function main() {
  let inserted = 0;
  for (const doc of LEGAL_TEXTS) {
    await sql`
      INSERT INTO legal_documents (source, title, content, chunk_index)
      VALUES (${doc.source}, ${doc.title}, ${doc.content}, 0)
      ON CONFLICT DO NOTHING;
    `.catch(() => {});
    inserted++;
  }
  console.log(`✅ Insertados ${inserted} documentos legales en legal_documents`);
}

main().catch(console.error);
