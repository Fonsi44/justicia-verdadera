/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import {
  cases,
  contacts,
  caseParties,
  caseEvents,
  documents,
  documentVersions,
  timeEntries,
  invoices,
  invoiceItems,
  payments,
  notifications,
} from "@/database/schema";

function rng() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomDate(start: Date, end: Date) {
  const t = start.getTime() + rng() * (end.getTime() - start.getTime());
  return new Date(t);
}

export const MOCK_LAWYERS = [
  { name: "Dr. Ricardo Mendoza", barNumber: "HN-8742", specialty: "civil" },
  { name: "Dra. Ana Lucía Torres", barNumber: "HN-9123", specialty: "penal" },
  { name: "Dr. Carlos Sandoval", barNumber: "HN-5601", specialty: "administrativo" },
  { name: "Dra. María José Reyes", barNumber: "HN-3348", specialty: "familia" },
  { name: "Dr. Fernando Aguilar", barNumber: "HN-7829", specialty: "mercantil" },
] as const;

const CLIENT_DATA = [
  { firstName: "José", lastName: "Martínez", company: null, id: "0801-1982-00453", email: "jose.martinez@email.hn", phone: "+504 9876-5432", address: "Col. Palmira, Tegucigalpa", notes: "Cliente recurrente. Prefiere comunicación por WhatsApp." },
  { firstName: "María", lastName: "López", company: null, id: "0801-1978-12345", email: "maria.lopez@email.hn", phone: "+504 9654-3210", address: "Residencial Santa Mónica, SPS", notes: "Proceso de divorcio en curso." },
  { firstName: "Roberto", lastName: "Castillo", company: null, id: "0501-1985-00678", email: "rcastillo@email.hn", phone: "+504 3344-8899", address: "Barrio El Centro, Comayagüela", notes: "" },
  { firstName: null, lastName: null, company: "Constructora Atlántida S.A.", id: "RTN-08019012345678", email: "legal@atlantida.hn", phone: "+504 2234-1001", address: "Edificio Torre Alfa, Blvd Morazán", notes: "Cliente corporativo. Facturación mensual." },
  { firstName: "Carmen", lastName: "Paz", company: null, id: "0801-1990-22468", email: "carmen.paz@email.hn", phone: "+504 8877-6655", address: "Col. Miraflores, Tegucigalpa", notes: "Referida por Dr. Mendoza." },
  { firstName: "Francisco", lastName: "Morales", company: null, id: "0501-1975-34567", email: "fmorales@email.hn", phone: "+504 9980-7766", address: "Residencial El Molino, SPS", notes: "" },
  { firstName: null, lastName: null, company: "Banco Nacional de Honduras S.A.", id: "RTN-05019001112222", email: "juridico@banconacional.hn", phone: "+504 2235-5000", address: "Centro Financiero, Tegucigalpa", notes: "Múltiples casos activos. Asignar a equipo." },
  { firstName: "Gloria", lastName: "Estrada", company: null, id: "0801-1988-50001", email: "gloria.estrada@email.hn", phone: "+504 3355-1122", address: "Col. Kennedy, Tegucigalpa", notes: "Contacto solo por email." },
  { firstName: "Antonio", lastName: "Núñez", company: null, id: "0801-1969-12789", email: "anunez@email.hn", phone: "+504 9901-2345", address: "Barrio Los Dolores, Tegucigalpa", notes: "Poder general otorgado." },
  { firstName: null, lastName: null, company: "Seguros Centroamérica S.A.", id: "RTN-08019005559999", email: "reclamos@segurosca.hn", phone: "+504 2256-7800", address: "Col. Lomas del Guijarro, Tegucigalpa", notes: "Reclamaciones de seguros." },
  { firstName: "Daniel", lastName: "Flores", company: null, id: "0801-1995-99000", email: "dflores@email.hn", phone: "+504 8822-4433", address: "Col. San Ignacio, Tegucigalpa", notes: "" },
  { firstName: "Rosa", lastName: "Guzmán", company: null, id: "0501-1983-55444", email: "rosa.guzman@email.hn", phone: "+504 9712-3456", address: "Residencial Villa Real, SPS", notes: "Asistente legal del cliente corporativo." },
] as const;

const CASES_DATA = [
  { number: "CV-2026-0042", courtNumber: "J-001-2026", title: "Martínez vs. Constructora Atlántida S.A.", description: "Demanda por incumplimiento de contrato de construcción. El cliente alega vicios ocultos en vivienda unifamiliar.", matter: "civil", status: "activo", priority: "alta", estimatedValue: "250000", start: "2026-01-15", end: null },
  { number: "PE-2026-0018", courtNumber: "JP-045-2026", title: "Defensa penal — Caso 0452-B", description: "Defensa en proceso penal por estafa agravada. El imputado es representante legal de empresa.", matter: "penal", status: "activo", priority: "urgente", estimatedValue: null, start: "2026-02-20", end: null },
  { number: "FA-2026-0031", courtNumber: "J-FAM-012-2026", title: "Divorcio Martínez-López", description: "Divorcio voluntario con liquidación de sociedad conyugal. Incluye custodia de menores.", matter: "familia", status: "activo", priority: "media", estimatedValue: "50000", start: "2026-03-01", end: null },
  { number: "CO-2025-0089", courtNumber: "J-CA-089-2025", title: "Recurso de amparo contra SAR", description: "Recurso de amparo contra resolución administrativa de la Dirección de Ingresos. Impuesto sobre la renta.", matter: "contencioso", status: "activo", priority: "alta", estimatedValue: "500000", start: "2025-11-10", end: null },
  { number: "LA-2026-0005", courtNumber: "J-T-005-2026", title: "Despido injustificado — García Méndez", description: "Reclamo laboral por despido sin causa justa. Reintegro y salarios caídos.", matter: "laboral", status: "archivado", priority: "baja", estimatedValue: "120000", start: "2026-01-05", end: "2026-04-20" },
  { number: "ME-2026-0022", courtNumber: "J-ME-022-2026", title: "Cobro judicial — Inversiones del Valle S.A.", description: "Demanda ejecutiva de cobro de facturas impagadas por servicios profesionales.", matter: "mercantil", status: "activo", priority: "media", estimatedValue: "180000", start: "2026-04-10", end: null },
  { number: "CC-2026-0015", courtNumber: "SC-015-2026", title: "Inconstitucionalidad — Decreto 45-2025", description: "Recurso de inconstitucionalidad contra decreto ejecutivo que regula tarifas notariales.", matter: "constitucional", status: "activo", priority: "alta", estimatedValue: null, start: "2026-05-01", end: null },
  { number: "FA-2025-0097", courtNumber: "J-FAM-097-2025", title: "Sucesión intestada — Familia Rodríguez", description: "Proceso sucesorio de bienes inmuebles y cuentas bancarias. Tres herederos.", matter: "familia", status: "archivado", priority: "media", estimatedValue: "350000", start: "2025-08-15", end: "2026-02-28" },
  { number: "CV-2026-0055", courtNumber: "J-055-2026", title: "Desalojo — Inmueble Col. Kennedy", description: "Acción de desalojo por falta de pago de alquileres. Más de 6 meses de mora.", matter: "civil", status: "activo", priority: "alta", estimatedValue: "45000", start: "2026-04-22", end: null },
  { number: "LA-2026-0012", courtNumber: "J-T-012-2026", title: "Reclamo prestaciones — Hernández", description: "Reclamo de prestaciones laborales. Antigüedad de 15 años. Cálculo actuarial pendiente.", matter: "laboral", status: "activo", priority: "urgente", estimatedValue: "280000", start: "2026-03-15", end: null },
  { number: "PE-2025-0055", courtNumber: "JP-055-2025", title: "Defensa penal — Caso 1289-C", description: "Defensa en proceso penal por fraude financiero. Investigación de la CNBS.", matter: "penal", status: "cerrado", priority: "alta", estimatedValue: null, start: "2025-06-10", end: "2025-12-15" },
  { number: "CO-2026-0033", courtNumber: "J-CA-033-2026", title: "Nulidad acto administrativo — alcaldía", description: "Demanda de nulidad de acto administrativo municipal. Licencia de construcción denegada.", matter: "contencioso", status: "activo", priority: "media", estimatedValue: "90000", start: "2026-05-05", end: null },
] as const;

const EVENTS_DATA = [
  { type: "vista", title: "Vista oral — Caso Martínez vs. Constructora", desc: "Primera vista. Presentación de pruebas documentales.", days: 3, location: "Tribunal de Sentencia, Sala 3", durationDays: 0 },
  { type: "audiencia", title: "Audiencia preliminar — Defensa penal 0452-B", desc: "Comparecencia del imputado. Medidas cautelares.", days: 5, location: "Juzgado de Letras Penal, Sala 1", durationDays: 0 },
  { type: "plazo", title: "Vence plazo de presentación de pruebas", desc: "Caso recurso de amparo fiscal.", days: 2, location: "", durationDays: 0 },
  { type: "plazo", title: "Vence plazo de contestación de demanda", desc: "Caso cobro judicial. Contestación de la parte demandada.", days: 7, location: "", durationDays: 0 },
  { type: "notificacion", title: "Notificación de sentencia — Sucesión Rodríguez", desc: "Sentencia definitiva. Plazo de apelación: 3 días hábiles.", days: -2, location: "Juzgado de Familia", durationDays: 0 },
  { type: "resolucion", title: "Resolución — Admisión recurso inconstitucionalidad", desc: "Sala Constitucional admite recurso. Se notifica a partes.", days: -5, location: "Sala de lo Constitucional", durationDays: 0 },
  { type: "vista", title: "Vista — Desalojo Col. Kennedy", desc: "Vista para verificar estado del inmueble.", days: 4, location: "Col. Kennedy, Tegucigalpa", durationDays: 0 },
  { type: "audiencia", title: "Audiencia conciliación — Reclamo prestaciones", desc: "Audiencia obligatoria de conciliación laboral.", days: 6, location: "Secretaría de Trabajo, Sala 2", durationDays: 0 },
  { type: "plazo", title: "Vence ISR declaración jurada clientes", desc: "Presentación de declaración jurada de ISR de clientes personas jurídicas.", days: 10, location: "", durationDays: 0 },
  { type: "sentencia", title: "Sentencia — Defensa penal 1289-C", desc: "Lectura de sentencia definitiva.", days: -20, location: "Tribunal de Sentencia, Sala 1", durationDays: 0 },
  { type: "vista", title: "Vista oral — Caso desalojo", desc: "Continuación de vista. Testigos de la parte actora.", days: 12, location: "Juzgado Civil, Sala 2", durationDays: 0 },
  { type: "audiencia", title: "Audiencia medidas cautelares", desc: "Discusión de medidas cautelares en caso de cobro judicial.", days: 8, location: "Juzgado Mercantil", durationDays: 0 },
  { type: "plazo", title: "Vence pago de tasa de justicia", desc: "Pago obligatorio de tasa de justicia para nuevo caso constitucional.", days: 1, location: "", durationDays: 0 },
  { type: "notificacion", title: "Notificación — Admisión demanda nulidad", desc: "Se notifica la admisión de la demanda de nulidad contra la alcaldía.", days: 14, location: "Juzgado Contencioso-Administrativo", durationDays: 0 },
] as const;

const DOCUMENTS_DATA = [
  { name: "Demanda — Martínez vs. Constructora v2", type: "demanda", status: "final", createdDays: -90 },
  { name: "Escrito de contestación — Defensa penal", type: "contestacion", status: "final", createdDays: -75 },
  { name: "Recurso de amparo fiscal — versión firmada", type: "recurso", status: "firmado", createdDays: -180 },
  { name: "Sentencia — Sucesión Rodríguez", type: "sentencia", status: "archivado", createdDays: -60 },
  { name: "Contrato de servicios profesionales — BNacional", type: "contrato", status: "firmado", createdDays: -200 },
  { name: "Poder general — Antonio Núñez", type: "poder", status: "firmado", createdDays: -150 },
  { name: "Pruebas documentales — Caso divorcio", type: "prueba", status: "final", createdDays: -30 },
  { name: "Informe pericial — Constructora Atlántida", type: "informe", status: "final", createdDays: -45 },
  { name: "Recurso de inconstitucionalidad — borrador", type: "recurso", status: "borrador", createdDays: -15 },
  { name: "Contestación — Cobro judicial", type: "contestacion", status: "final", createdDays: -20 },
  { name: "Pruebas fotográficas — Desalojo", type: "prueba", status: "borrador", createdDays: -5 },
  { name: "Informe legal — SAR amparo", type: "informe", status: "archivado", createdDays: -120 },
  { name: "Contrato de honorarios — Seguros CA", type: "contrato", status: "firmado", createdDays: -100 },
  { name: "Demanda laboral — García Méndez", type: "demanda", status: "final", createdDays: -140 },
] as const;

const INVOICES_DATA = [
  { number: "FAC-2026-0001", status: "pagada", amount: 15000, daysAgo: -120, due: -90, paid: -80 },
  { number: "FAC-2026-0007", status: "emitida", amount: 22500, daysAgo: -30, due: 15, paid: null },
  { number: "FAC-2026-0012", status: "vencida", amount: 8750, daysAgo: -60, due: -30, paid: null },
  { number: "FAC-2026-0018", status: "emitida", amount: 42000, daysAgo: -15, due: 15, paid: null },
  { number: "FAC-2026-0023", status: "borrador", amount: 18500, daysAgo: -5, due: 25, paid: null },
  { number: "FAC-2026-0030", status: "pagada", amount: 9500, daysAgo: -90, due: -60, paid: -55 },
  { number: "FAC-2026-0035", status: "emitida", amount: 31500, daysAgo: -10, due: 20, paid: null },
  { number: "FAC-2026-0042", status: "vencida", amount: 12700, daysAgo: -75, due: -45, paid: null },
] as const;

const OCR_TEXTS = [
  "DEMANDA CIVIL POR INCUMPLIMIENTO DE CONTRATO\n\nAL JUZGADO DE LETRAS CIVIL DEL DEPARTAMENTO DE FRANCISCO MORAZÁN\n\nYo, José Martínez, mayor de edad, hondureño, con identidad número 0801-1982-00453, actuando en mi condición personal, comparezco ante este Juzgado a interponer DEMANDA CIVIL POR INCUMPLIMIENTO DE CONTRATO contra CONSTRUCTORA ATLÁNTIDA S.A., con RTN-08019012345678, representada legalmente por su Gerente General.\n\nHECHOS:\n1. En fecha 15 de enero de 2025, el demandante suscribió contrato de construcción con la demandada para la edificación de vivienda unifamiliar en Colonia Palmira, Tegucigalpa.\n2. El contrato establecía un plazo de ejecución de 12 meses y un valor total de DOSCIENTOS CINCUENTA MIL LEMPIRAS (L. 250,000.00).",
  "ESCRITO DE CONTESTACIÓN DE DEMANDA PENAL\n\nAL JUZGADO DE LETRAS PENAL DEL DEPARTAMENTO DE FRANCISCO MORAZÁN\n\nYo, Roberto Castillo, en mi calidad de imputado dentro del proceso penal número 0452-B, comparezco a través de mi apoderado legal a presentar ESCRITO DE CONTESTACIÓN.\n\nEl Ministerio Público ha presentado requerimiento fiscal en mi contra por el supuesto delito de ESTAFA AGRAVADA, tipificado en el artículo 248 del Código Penal.\n\nNiego categóricamente los hechos que se me imputan. La transacción comercial objeto de investigación fue realizada conforme a derecho.",
  "RECURSO DE AMPARO FISCAL\n\nA LA SALA DE LO CONSTITUCIONAL DE LA CORTE SUPREMA DE JUSTICIA\n\nComparezco ante la Honorable Sala de lo Constitucional a interponer RECURSO DE AMPARO contra la resolución SAR-DE-2025-089 emitida por la Dirección de Ingresos de la Secretaría de Finanzas.\n\nLa resolución impugnada determina un ajuste al Impuesto Sobre la Renta del período fiscal 2024 por QUINIENTOS MIL LEMPIRAS (L. 500,000.00).\n\nFUNDAMENTOS DE DERECHO:\nLa resolución vulnera el derecho constitucional a la defensa.",
  "SENTENCIA DEFINITIVA\n\nJUZGADO DE FAMILIA DEL DEPARTAMENTO DE FRANCISCO MORAZÁN\n\nEXPEDIENTE: FA-2025-0097\n\nEn la ciudad de Tegucigalpa, a los quince días del mes de agosto de dos mil veinticinco.\n\nVISTOS para dictar sentencia los autos del proceso de SUCESIÓN INTESTADA promovido por los herederos de la señora María Elena Rodríguez.\n\nRESULTA:\nQue en fecha 15 de agosto de 2025 comparecieron ante este Juzgado los señores Carlos, Ana y Fernando Rodríguez.",
  "CONTRATO DE SERVICIOS PROFESIONALES\n\nEntre BANCO NACIONAL DE HONDURAS S.A., representada por su Gerente Legal, y el Despacho de Abogados Justicia Verdadera, representado por el Dr. Ricardo Mendoza.\n\nCLÁUSULA PRIMERA - OBJETO: El Despacho se obliga a prestar servicios de asesoría legal permanente en materia mercantil, laboral y contencioso-administrativa.\n\nCLÁUSULA SEGUNDA - HONORARIOS: Se pactan honorarios mensuales de CUARENTA Y DOS MIL LEMPIRAS (L. 42,000.00).",
  "PODER GENERAL DE REPRESENTACIÓN\n\nEn la ciudad de Tegucigalpa, a los diez días del mes de marzo de dos mil veintiséis.\n\nAnte mí, Notario Público debidamente autorizado, comparece el señor ANTONIO NÚÑEZ, mayor de edad, hondureño, con identidad número 0801-1969-12789, quien otorga PODER GENERAL DE REPRESENTACIÓN a favor del Dr. Ricardo Mendoza.\n\nEl poderdante confiere facultades de administración general para que en su nombre y representación realice todos los actos y gestiones necesarios.",
  "PRUEBAS DOCUMENTALES\n\nDentro del proceso de DIVORCIO VOLUNTARIO, expediente FA-2026-0031, se presentan las siguientes pruebas documentales:\n\n1. Acta de matrimonio inscrita en el Registro Civil.\n2. Certificación de partidas de nacimiento de los menores.\n3. Estado de cuentas bancarias conjuntas.\n4. Escritura de propiedad del inmueble ubicado en Residencial Santa Mónica, San Pedro Sula.\n5. Declaración jurada de bienes de la sociedad conyugal.",
  "INFORME PERICIAL DE INGENIERÍA\n\nEXPEDIENTE: CV-2026-0042\n\nINFORME TÉCNICO elaborado por el perito ingeniero civil designado por el Juzgado en relación con los vicios de construcción alegados por el demandante.\n\nMETODOLOGÍA:\nSe realizó inspección ocular del inmueble en tres visitas técnicas. Se tomaron muestras de materiales de construcción y se realizaron pruebas de resistencia estructural.\n\nHALLAZGOS:\n1. Fisuras en muros de carga con anchura superior a 3mm.\n2. Humedad por capilaridad en muro perimetral.",
  "RECURSO DE INCONSTITUCIONALIDAD\n\nA LA SALA DE LO CONSTITUCIONAL\n\nComparezco a interponer RECURSO DE INCONSTITUCIONALIDAD contra el Decreto Ejecutivo número 45-2025 emitido por el Presidente de la República.\n\nEl decreto impugnado regula las tarifas notariales aplicables a instrumentos públicos, excediendo las facultades reglamentarias del Poder Ejecutivo e invadiendo competencias exclusivas del Poder Legislativo.",
  "CONTESTACIÓN DE DEMANDA MERCANTIL\n\nAL JUZGADO DE LETRAS MERCANTIL\n\nComparezco en representación de INVERSIONES DEL VALLE S.A. a contestar la demanda ejecutiva de cobro interpuesta en nuestra contra.\n\nLa parte actora reclama el pago de facturas por servicios profesionales. Sin embargo, los servicios facturados no fueron prestados conforme a lo pactado, existiendo incumplimiento contractual por parte del demandante.",
  "INFORME LEGAL\n\nPARA: Dirección de Ingresos, SAR\nDE: Despacho Justicia Verdadera\nFECHA: 5 de mayo de 2026\n\nASUNTO: Análisis jurídico del ajuste fiscal determinado mediante resolución SAR-DE-2025-089.\n\nI. ANTECEDENTES\nEl contribuyente presentó declaración jurada de Impuesto Sobre la Renta correspondiente al período fiscal 2024. La SAR realizó fiscalización determinando un ajuste de L. 500,000.00.",
  "CONTRATO DE HONORARIOS\n\nEntre SEGUROS CENTROAMÉRICA S.A. y el Despacho de Abogados Justicia Verdadera.\n\nPRIMERA: El Despacho prestará servicios de representación legal en reclamaciones de seguros ante los tribunales competentes.\n\nSEGUNDA: Los honorarios se calcularán sobre la base de QUINCE MIL LEMPIRAS (L. 15,000.00) mensuales más un porcentaje del 10% sobre el monto recuperado en cada reclamación exitosa.",
  "DEMANDA LABORAL\n\nAL JUZGADO DE LETRAS DE TRABAJO\n\nComparezco en representación del señor CARLOS HERNÁNDEZ a interponer DEMANDA LABORAL POR DESPIDO INJUSTIFICADO Y RECLAMO DE PRESTACIONES.\n\nEl trabajador laboró para la empresa demandada por un período de QUINCE AÑOS, desempeñando el cargo de Supervisor de Operaciones. Fue despedido sin causa justificada el 10 de enero de 2026.",
  "INFORME PERICIAL CONTABLE\n\nEXPEDIENTE: PE-2025-0055\n\nInforme elaborado por perito contable designado en el proceso penal por fraude financiero.\n\nSe realizó auditoría forense de los estados financieros de la empresa investigada correspondientes a los períodos 2023-2025.\n\nSe identificaron irregularidades en cuentas por cobrar y pagos a proveedores no registrados.",
];

export async function seedMockData(firmId: string, userId: string) {
  const now = new Date();

  const existing = await db
    .select({ count: count() })
    .from(cases)
    .where(eq(cases.firmId, firmId));

  if (Number(existing[0]?.count ?? 0) > 0) {
    return { skipped: true, reason: "Firm already has data" } as const;
  }

  const lawyerIds = [userId, userId, userId];

  // ── CONTACTS ──
  const contactRecords = CLIENT_DATA.map((c) => ({
    firmId,
    type: c.company ? "persona_juridica" as const : "persona_natural" as const,
    firstName: c.firstName,
    lastName: c.lastName,
    companyName: c.company,
    identityNumber: c.id,
    email: c.email,
    phone: c.phone,
    address: c.address,
    notes: c.notes || null,
  }));

  const contactIds: string[] = [];
  for (const c of contactRecords) {
    const [rec] = await db.insert(contacts).values(c).returning({ id: contacts.id });
    contactIds.push(rec.id);
  }

  // ── CASES ──
  const caseRecords = CASES_DATA.map((c, i) => ({
    firmId,
    number: c.number,
    courtNumber: c.courtNumber,
    title: c.title,
    description: c.description,
    matter: c.matter,
    status: c.status,
    priority: c.priority,
    assignedLawyerId: lawyerIds[i % lawyerIds.length],
    startDate: c.start,
    endDate: c.end,
    estimatedValue: c.estimatedValue,
  }));

  const caseIds: string[] = [];
  for (const c of caseRecords) {
    const [rec] = await db.insert(cases).values(c).returning({ id: cases.id });
    caseIds.push(rec.id);
  }

  // ── CASE PARTIES ──
  for (let i = 0; i < caseIds.length; i++) {
    const mainIdx = i % contactIds.length;
    const otherIdx = (i + 1 + Math.floor(i / 3)) % contactIds.length;

    await db.insert(caseParties).values({
      caseId: caseIds[i],
      contactId: contactIds[mainIdx],
      role: "cliente",
      isMain: true,
    });

    if (otherIdx !== mainIdx && i < 8) {
      await db.insert(caseParties).values({
        caseId: caseIds[i],
        contactId: contactIds[otherIdx],
        role: pick(["contraria", "testigo", "perito"]) as "contraria" | "testigo" | "perito",
        isMain: false,
      });
    }
  }

  // ── CASE EVENTS ──
  for (let i = 0; i < EVENTS_DATA.length; i++) {
    const evt = EVENTS_DATA[i];
    const caseIdx = i % caseIds.length;
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + evt.days);

    await db.insert(caseEvents).values({
      caseId: caseIds[caseIdx],
      type: evt.type,
      title: evt.title,
      description: evt.desc,
      date: eventDate.toISOString(),
      endDate: evt.durationDays > 0
        ? new Date(eventDate.getTime() + evt.durationDays * 86400000).toISOString()
        : null,
      location: evt.location || null,
      isCompleted: evt.days < 0,
      createdBy: userId,
    } as any);
  }

  // ── DOCUMENTS ──
  const docIds: string[] = [];
  for (let i = 0; i < DOCUMENTS_DATA.length; i++) {
    const doc = DOCUMENTS_DATA[i];
    const caseIdx = i % caseIds.length;
    const createdDate = new Date(now);
    createdDate.setDate(createdDate.getDate() + doc.createdDays);

    const [d] = await db.insert(documents).values({
      firmId,
      caseId: caseIds[caseIdx],
      name: doc.name,
      type: doc.type,
      currentVersion: doc.status === "borrador" ? 1 : pick([1, 2, 3]),
      status: doc.status,
      ocrText: OCR_TEXTS[i] ?? null,
      processingStatus: "ocr_complete",
      createdBy: userId,
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
    } as any).returning({ id: documents.id });

    await db.insert(documentVersions).values({
      documentId: d.id,
      version: 1,
      fileUrl: `https://storage.example.com/docs/${d.id}/v1`,
      fileKey: `${d.id}/v1`,
      fileSize: Math.floor(50000 + rng() * 500000),
      mimeType: pick(["application/pdf", "application/pdf", "image/png"]),
      createdBy: userId,
    } as any);

    docIds.push(d.id);
  }

  // ── TIME ENTRIES ──
  const descriptions = [
    "Revisión de expediente y antecedentes",
    "Redacción de escrito de demanda",
    "Reunión con cliente para recabar información",
    "Análisis de jurisprudencia aplicable",
    "Preparación de pruebas documentales",
    "Asistencia a audiencia",
    "Redacción de informe legal",
    "Revisión de contrato y anexos",
    "Llamada con perito designado",
    "Estudio de doctrina y legislación aplicable",
  ];

  for (let i = 0; i < 20; i++) {
    const caseIdx = i % caseIds.length;
    const minutes = Math.floor(30 + rng() * 180);
    const startTime = randomDate(
      new Date(now.getTime() - 60 * 86400000),
      now,
    );

    await db.insert(timeEntries).values({
      caseId: caseIds[caseIdx],
      userId: lawyerIds[caseIdx % lawyerIds.length],
      description: `${descriptions[i % descriptions.length]}${i > 9 ? " (continuación)" : ""}`,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + minutes * 60000).toISOString(),
      durationMinutes: minutes,
      hourlyRate: "1500",
      isBillable: rng() > 0.2,
      isInvoiced: i < 8,
    } as any);
  }

  // ── INVOICES ──
  for (let i = 0; i < INVOICES_DATA.length; i++) {
    const inv = INVOICES_DATA[i];
    const clientIdx = (i * 2) % contactIds.length;
    const issueDate = new Date(now);
    issueDate.setDate(issueDate.getDate() + inv.daysAgo);
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + inv.due);
    const paidDate = inv.paid ? new Date(now.getTime() + inv.paid * 86400000) : null;

    const subtotal = Math.round(inv.amount / 1.15 * 100) / 100;
    const tax = Math.round((inv.amount - subtotal) * 100) / 100;

    const [createdInv] = await db.insert(invoices).values({
      firmId,
      caseId: caseIds[i % caseIds.length],
      clientId: contactIds[clientIdx],
      number: inv.number,
      status: inv.status,
      subtotal: String(subtotal),
      tax: String(tax),
      total: String(inv.amount),
      currency: "HNL",
      issueDate: issueDate.toISOString().split("T")[0],
      dueDate: dueDate.toISOString().split("T")[0],
      paidAt: paidDate?.toISOString() ?? null,
      notes: i % 3 === 0 ? "Facturación mensual según contrato de servicios." : null,
    } as any).returning({ id: invoices.id });

    await db.insert(invoiceItems).values({
      invoiceId: createdInv.id,
      description: "Honorarios profesionales — servicios legales",
      quantity: "1",
      unitPrice: String(inv.amount),
      total: String(inv.amount),
    } as any);

    if (inv.status === "pagada" && paidDate) {
      await db.insert(payments).values({
        firmId,
        invoiceId: createdInv.id,
        amount: String(inv.amount),
        method: pick(["transferencia", "transferencia", "efectivo", "cheque"]),
        reference: `PAGO-${inv.number}`,
        notes: null,
        paidAt: paidDate.toISOString(),
      } as any);
    }
  }

  // ── NOTIFICATIONS ──
  const notificationData = [
    {
      firmId,
      userId,
      type: "plazo" as const,
      title: "Vence plazo de contestación",
      body: "El caso HC-2026-001 tiene un plazo de contestación que vence en 3 días.",
      channel: "in_app" as const,
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      firmId,
      userId,
      type: "vista" as const,
      title: "Vista programada para mañana",
      body: "Vista oral en el caso HC-2026-003 programada para las 9:00 AM.",
      channel: "in_app" as const,
      isRead: false,
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      firmId,
      userId,
      type: "factura" as const,
      title: "Factura FAC-001 próxima a vencer",
      body: "La factura FAC-001 del cliente María García vence en 5 días.",
      channel: "in_app" as const,
      isRead: true,
      readAt: new Date(),
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      firmId,
      userId,
      type: "documento" as const,
      title: "Documento subido correctamente",
      body: "El documento 'Dictamen Pericial' fue subido al caso HC-2026-002.",
      channel: "in_app" as const,
      isRead: false,
      createdAt: new Date(Date.now() - 1800000),
    },
    {
      firmId,
      userId,
      type: "sistema" as const,
      title: "Bienvenido a Justicia Verdadera",
      body: "Tu cuenta ha sido activada. Revisa la guía de inicio rápido para comenzar.",
      channel: "in_app" as const,
      isRead: false,
      createdAt: new Date(Date.now() - 604800000),
    },
  ];

  await db.insert(notifications).values(notificationData);

  return {
    caseCount: caseIds.length,
    contactCount: contactIds.length,
    documentCount: docIds.length,
    invoiceCount: INVOICES_DATA.length,
    eventCount: EVENTS_DATA.length,
  };
}
