import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/database/schema";
import { config } from "dotenv";
import { eq, count } from "drizzle-orm";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const {
  firms, users, cases, contacts, caseParties, caseEvents,
  documents, documentVersions, timeEntries, invoices, invoiceItems,
  payments, notifications,
} = schema;

function rng() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 0xffffffff;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const DEMO_FIRM = {
  name: "Bufete Jurídico Demo",
  slug: "bufete-demo",
  contactEmail: "demo@bufete.hn",
  contactPhone: "+504 2234-5678",
  address: "Col. Palmira, Edificio Ochoa, 3er piso, Tegucigalpa",
  taxId: "RTN-08019009999999",
  isvRate: "15",
  subscriptionStatus: "trial",
  subscriptionTier: "despacho",
  aiSpendingLimit: "500",
};

const DEMO_USERS = [
  { name: "Dr. Ricardo Mendoza", email: "admin@bufete.hn", role: "admin" as const, barNumber: "HN-8742", specialty: "civil" },
  { name: "Dra. Ana Lucía Torres", email: "abogado@bufete.hn", role: "lawyer" as const, barNumber: "HN-9123", specialty: "penal" },
];

const CLIENT_DATA = [
  { firstName: "José", lastName: "Martínez", company: null, id: "0801-1982-00453", email: "jose.martinez@email.hn", phone: "+504 9876-5432", address: "Col. Palmira, Tegucigalpa", notes: "Cliente recurrente." },
  { firstName: "María", lastName: "López", company: null, id: "0801-1978-12345", email: "maria.lopez@email.hn", phone: "+504 9654-3210", address: "Residencial Santa Mónica, SPS", notes: "Proceso de divorcio." },
  { firstName: "Roberto", lastName: "Castillo", company: null, id: "0501-1985-00678", email: "rcastillo@email.hn", phone: "+504 3344-8899", address: "Barrio El Centro, Comayagüela", notes: "" },
  { firstName: null, lastName: null, company: "Constructora Atlántida S.A.", id: "RTN-08019012345678", email: "legal@atlantida.hn", phone: "+504 2234-1001", address: "Edificio Torre Alfa, Blvd Morazán", notes: "Cliente corporativo." },
  { firstName: "Carmen", lastName: "Paz", company: null, id: "0801-1990-22468", email: "carmen.paz@email.hn", phone: "+504 8877-6655", address: "Col. Miraflores, Tegucigalpa", notes: "" },
  { firstName: "Francisco", lastName: "Morales", company: null, id: "0501-1975-34567", email: "fmorales@email.hn", phone: "+504 9980-7766", address: "Residencial El Molino, SPS", notes: "" },
  { firstName: null, lastName: null, company: "Banco Nacional de Honduras S.A.", id: "RTN-05019001112222", email: "juridico@banconacional.hn", phone: "+504 2235-5000", address: "Centro Financiero, Tegucigalpa", notes: "Múltiples casos activos." },
  { firstName: "Gloria", lastName: "Estrada", company: null, id: "0801-1988-50001", email: "gloria.estrada@email.hn", phone: "+504 3355-1122", address: "Col. Kennedy, Tegucigalpa", notes: "" },
  { firstName: "Antonio", lastName: "Núñez", company: null, id: "0801-1969-12789", email: "anunez@email.hn", phone: "+504 9901-2345", address: "Barrio Los Dolores, Tegucigalpa", notes: "Poder general." },
  { firstName: null, lastName: null, company: "Seguros Centroamérica S.A.", id: "RTN-08019005559999", email: "reclamos@segurosca.hn", phone: "+504 2256-7800", address: "Col. Lomas del Guijarro, Tegucigalpa", notes: "Reclamaciones de seguros." },
  { firstName: "Daniel", lastName: "Flores", company: null, id: "0801-1995-99000", email: "dflores@email.hn", phone: "+504 8822-4433", address: "Col. San Ignacio, Tegucigalpa", notes: "" },
  { firstName: "Rosa", lastName: "Guzmán", company: null, id: "0501-1983-55444", email: "rosa.guzman@email.hn", phone: "+504 9712-3456", address: "Residencial Villa Real, SPS", notes: "" },
  { firstName: "Héctor", lastName: "Rivas", company: null, id: "0801-1992-77123", email: "hrivas@email.hn", phone: "+504 9900-1122", address: "Col. La Pradera, Tegucigalpa", notes: "" },
  { firstName: null, lastName: null, company: "Inversiones del Valle S.A.", id: "RTN-08019008887777", email: "cobros@inversionesvalle.hn", phone: "+504 2260-3030", address: "Edificio Europa, SPS", notes: "Demandas ejecutivas." },
  { firstName: "Sofía", lastName: "Vásquez", company: null, id: "0801-1987-33900", email: "sofia.vasquez@email.hn", phone: "+504 8877-3344", address: "Col. Lomas del Mayab, Tegucigalpa", notes: "Caso laboral." },
  { firstName: "Luis", lastName: "Medina", company: null, id: "0801-1980-88442", email: "lmedina@email.hn", phone: "+504 9765-4321", address: "Barrio La Hoya, Tegucigalpa", notes: "" },
  { firstName: null, lastName: null, company: "Comercial del Norte S.A.", id: "RTN-05019007776666", email: "facturacion@comercialnorte.hn", phone: "+504 2250-8080", address: "Zona Industrial, SPS", notes: "Contrato de servicios." },
  { firstName: "Elena", lastName: "Sandoval", company: null, id: "0801-1993-55678", email: "esandoval@email.hn", phone: "+504 3344-5566", address: "Col. Los Castaños, Tegucigalpa", notes: "Testigo en caso civil." },
  { firstName: "Pedro", lastName: "Aguirre", company: null, id: "0801-1972-99123", email: "paguirre@email.hn", phone: "+504 9988-7766", address: "Col. San Felipe, Tegucigalpa", notes: "" },
  { firstName: null, lastName: null, company: "Farmacias Unidas S.A.", id: "RTN-08019004443333", email: "legal@farmaciasunidas.hn", phone: "+504 2210-9090", address: "Blvd Morazán, Tegucigalpa", notes: "Asesoría mercantil." },
];

const CASES_DATA = [
  { number: "CV-2026-0042", courtNumber: "J-001-2026", title: "Martínez vs. Constructora Atlántida S.A.", description: "Demanda por incumplimiento de contrato de construcción. Vicios ocultos en vivienda unifamiliar.", matter: "civil" as const, status: "activo" as const, priority: "alta" as const, estimatedValue: "250000", start: "2026-01-15", end: null },
  { number: "PE-2026-0018", courtNumber: "JP-045-2026", title: "Defensa penal — Caso 0452-B", description: "Defensa en proceso penal por estafa agravada. Representante legal de empresa.", matter: "penal" as const, status: "activo" as const, priority: "urgente" as const, estimatedValue: null, start: "2026-02-20", end: null },
  { number: "FA-2026-0031", courtNumber: "J-FAM-012-2026", title: "Divorcio Martínez-López", description: "Divorcio voluntario con liquidación de sociedad conyugal y custodia de menores.", matter: "familia" as const, status: "activo" as const, priority: "media" as const, estimatedValue: "50000", start: "2026-03-01", end: null },
  { number: "CO-2025-0089", courtNumber: "J-CA-089-2025", title: "Recurso de amparo contra SAR", description: "Recurso de amparo contra resolución administrativa de la Dirección de Ingresos.", matter: "contencioso" as const, status: "activo" as const, priority: "alta" as const, estimatedValue: "500000", start: "2025-11-10", end: null },
  { number: "LA-2026-0005", courtNumber: "J-T-005-2026", title: "Despido injustificado — García Méndez", description: "Reclamo laboral por despido sin causa justa. Reintegro y salarios caídos.", matter: "laboral" as const, status: "archivado" as const, priority: "baja" as const, estimatedValue: "120000", start: "2026-01-05", end: "2026-04-20" },
  { number: "ME-2026-0022", courtNumber: "J-ME-022-2026", title: "Cobro judicial — Inversiones del Valle S.A.", description: "Demanda ejecutiva de cobro de facturas impagadas por servicios profesionales.", matter: "mercantil" as const, status: "activo" as const, priority: "media" as const, estimatedValue: "180000", start: "2026-04-10", end: null },
  { number: "CC-2026-0015", courtNumber: "SC-015-2026", title: "Inconstitucionalidad — Decreto 45-2025", description: "Recurso de inconstitucionalidad contra decreto ejecutivo que regula tarifas notariales.", matter: "constitucional" as const, status: "activo" as const, priority: "alta" as const, estimatedValue: null, start: "2026-05-01", end: null },
  { number: "FA-2025-0097", courtNumber: "J-FAM-097-2025", title: "Sucesión intestada — Familia Rodríguez", description: "Proceso sucesorio de bienes inmuebles y cuentas bancarias. Tres herederos.", matter: "familia" as const, status: "archivado" as const, priority: "media" as const, estimatedValue: "350000", start: "2025-08-15", end: "2026-02-28" },
  { number: "CV-2026-0055", courtNumber: "J-055-2026", title: "Desalojo — Inmueble Col. Kennedy", description: "Acción de desalojo por falta de pago de alquileres. Más de 6 meses de mora.", matter: "civil" as const, status: "activo" as const, priority: "alta" as const, estimatedValue: "45000", start: "2026-04-22", end: null },
  { number: "LA-2026-0012", courtNumber: "J-T-012-2026", title: "Reclamo prestaciones — Hernández", description: "Reclamo de prestaciones laborales. Antigüedad de 15 años.", matter: "laboral" as const, status: "activo" as const, priority: "urgente" as const, estimatedValue: "280000", start: "2026-03-15", end: null },
  { number: "PE-2025-0055", courtNumber: "JP-055-2025", title: "Defensa penal — Caso 1289-C", description: "Defensa en proceso penal por fraude financiero. Investigación de la CNBS.", matter: "penal" as const, status: "cerrado" as const, priority: "alta" as const, estimatedValue: null, start: "2025-06-10", end: "2025-12-15" },
  { number: "CO-2026-0033", courtNumber: "J-CA-033-2026", title: "Nulidad acto administrativo — alcaldía", description: "Demanda de nulidad de acto administrativo municipal. Licencia de construcción denegada.", matter: "contencioso" as const, status: "activo" as const, priority: "media" as const, estimatedValue: "90000", start: "2026-05-05", end: null },
  { number: "ME-2026-0045", courtNumber: "J-ME-045-2026", title: "Cobro de cheques sin fondos — Comercial Norte", description: "Demanda cambiaria por cheques protestados por falta de fondos.", matter: "mercantil" as const, status: "activo" as const, priority: "alta" as const, estimatedValue: "150000", start: "2026-05-10", end: null },
  { number: "CV-2026-0061", courtNumber: "J-061-2026", title: "Responsabilidad civil — Accidente de tránsito", description: "Demanda por daños y perjuicios derivados de accidente vehicular.", matter: "civil" as const, status: "activo" as const, priority: "media" as const, estimatedValue: "320000", start: "2026-05-20", end: null },
  { number: "FA-2026-0038", courtNumber: "J-FAM-038-2026", title: "Régimen de visitas — Familia Medina", description: "Modificación del régimen de visitas de menores. Desacuerdo entre progenitores.", matter: "familia" as const, status: "activo" as const, priority: "media" as const, estimatedValue: null, start: "2026-05-25", end: null },
];

const EVENTS_DATA = [
  { type: "vista" as const, title: "Vista oral — Martínez vs. Constructora", desc: "Presentación de pruebas documentales.", days: 3, location: "Tribunal de Sentencia, Sala 3", durationDays: 0 },
  { type: "audiencia" as const, title: "Audiencia preliminar — Defensa penal 0452-B", desc: "Comparecencia del imputado. Medidas cautelares.", days: 5, location: "Juzgado de Letras Penal, Sala 1", durationDays: 0 },
  { type: "plazo" as const, title: "Vence plazo de presentación de pruebas", desc: "Caso recurso de amparo fiscal.", days: 2, location: "", durationDays: 0 },
  { type: "plazo" as const, title: "Vence plazo de contestación de demanda", desc: "Caso cobro judicial.", days: 7, location: "", durationDays: 0 },
  { type: "notificacion" as const, title: "Notificación de sentencia — Sucesión Rodríguez", desc: "Sentencia definitiva. Plazo de apelación: 3 días hábiles.", days: -2, location: "Juzgado de Familia", durationDays: 0 },
  { type: "resolucion" as const, title: "Resolución — Admisión recurso inconstitucionalidad", desc: "Sala Constitucional admite recurso.", days: -5, location: "Sala de lo Constitucional", durationDays: 0 },
  { type: "vista" as const, title: "Vista — Desalojo Col. Kennedy", desc: "Vista para verificar estado del inmueble.", days: 4, location: "Col. Kennedy, Tegucigalpa", durationDays: 0 },
  { type: "audiencia" as const, title: "Audiencia conciliación — Reclamo prestaciones", desc: "Audiencia obligatoria de conciliación laboral.", days: 6, location: "Secretaría de Trabajo, Sala 2", durationDays: 0 },
  { type: "plazo" as const, title: "Vence ISR declaración jurada", desc: "Presentación de declaración jurada de ISR de clientes.", days: 10, location: "", durationDays: 0 },
  { type: "sentencia" as const, title: "Sentencia — Defensa penal 1289-C", desc: "Lectura de sentencia definitiva.", days: -20, location: "Tribunal de Sentencia, Sala 1", durationDays: 0 },
];

const DOCUMENTS_DATA = [
  { name: "Demanda — Martínez vs. Constructora", type: "demanda" as const, status: "final" as const, createdDays: -90 },
  { name: "Escrito de contestación — Defensa penal", type: "contestacion" as const, status: "final" as const, createdDays: -75 },
  { name: "Recurso de amparo fiscal — versión firmada", type: "recurso" as const, status: "firmado" as const, createdDays: -180 },
  { name: "Sentencia — Sucesión Rodríguez", type: "sentencia" as const, status: "archivado" as const, createdDays: -60 },
  { name: "Contrato de servicios — Banco Nacional", type: "contrato" as const, status: "firmado" as const, createdDays: -200 },
  { name: "Poder general — Antonio Núñez", type: "poder" as const, status: "firmado" as const, createdDays: -150 },
  { name: "Pruebas documentales — Divorcio", type: "prueba" as const, status: "final" as const, createdDays: -30 },
  { name: "Informe pericial — Constructora", type: "informe" as const, status: "final" as const, createdDays: -45 },
  { name: "Recurso de inconstitucionalidad — borrador", type: "recurso" as const, status: "borrador" as const, createdDays: -15 },
  { name: "Contestación — Cobro judicial", type: "contestacion" as const, status: "final" as const, createdDays: -20 },
  { name: "Pruebas fotográficas — Desalojo", type: "prueba" as const, status: "borrador" as const, createdDays: -5 },
  { name: "Informe legal — Amparo SAR", type: "informe" as const, status: "archivado" as const, createdDays: -120 },
  { name: "Contrato de honorarios — Seguros CA", type: "contrato" as const, status: "firmado" as const, createdDays: -100 },
  { name: "Demanda laboral — García Méndez", type: "demanda" as const, status: "final" as const, createdDays: -140 },
  { name: "Demanda ejecutiva — Inversiones Valle", type: "demanda" as const, status: "final" as const, createdDays: -25 },
  { name: "Contrato arrendamiento — Col. Kennedy", type: "contrato" as const, status: "firmado" as const, createdDays: -300 },
  { name: "Dictamen pericial contable", type: "informe" as const, status: "final" as const, createdDays: -10 },
  { name: "Escrito de modificación — Régimen visitas", type: "contestacion" as const, status: "borrador" as const, createdDays: -2 },
  { name: "Cheques protestados — Comercial Norte", type: "prueba" as const, status: "final" as const, createdDays: -8 },
  { name: "Denuncia accidente de tránsito", type: "prueba" as const, status: "borrador" as const, createdDays: -3 },
  { name: "Contrato sociedad — Farmacias Unidas", type: "contrato" as const, status: "borrador" as const, createdDays: -1 },
  { name: "Poder especial — Carmen Paz", type: "poder" as const, status: "firmado" as const, createdDays: -60 },
  { name: "Informe pericial ingeniería v2", type: "informe" as const, status: "final" as const, createdDays: -35 },
  { name: "Recurso de apelación — Desalojo", type: "recurso" as const, status: "borrador" as const, createdDays: -4 },
  { name: "Acta de conciliación laboral", type: "sentencia" as const, status: "final" as const, createdDays: -50 },
  { name: "Pruebas documentales — Accidente tránsito", type: "prueba" as const, status: "borrador" as const, createdDays: -7 },
  { name: "Contrato prestación servicios — Comercial Norte", type: "contrato" as const, status: "firmado" as const, createdDays: -80 },
  { name: "Demanda nulidad — Alcaldía", type: "demanda" as const, status: "final" as const, createdDays: -12 },
  { name: "Informe legal — ISR clientes", type: "informe" as const, status: "final" as const, createdDays: -6 },
  { name: "Poder general — Francisco Morales", type: "poder" as const, status: "firmado" as const, createdDays: -90 },
];

const OCR_TEXTS = [
  "DEMANDA CIVIL POR INCUMPLIMIENTO DE CONTRATO\n\nAL JUZGADO DE LETRAS CIVIL DEL DEPARTAMENTO DE FRANCISCO MORAZÁN\n\nYo, José Martínez, mayor de edad, hondureño, con identidad número 0801-1982-00453, actuando en mi condición personal, comparezco ante este Juzgado a interponer DEMANDA CIVIL POR INCUMPLIMIENTO DE CONTRATO contra CONSTRUCTORA ATLÁNTIDA S.A., con RTN-08019012345678.",
  "ESCRITO DE CONTESTACIÓN DE DEMANDA PENAL\n\nAL JUZGADO DE LETRAS PENAL\n\nYo, Roberto Castillo, en mi calidad de imputado dentro del proceso penal número 0452-B, comparezco a través de mi apoderado legal. El Ministerio Público ha presentado requerimiento fiscal en mi contra por el supuesto delito de ESTAFA AGRAVADA, tipificado en el artículo 248 del Código Penal.",
  "RECURSO DE AMPARO FISCAL\n\nA LA SALA DE LO CONSTITUCIONAL\n\nInterpongo RECURSO DE AMPARO contra la resolución SAR-DE-2025-089 emitida por la Dirección de Ingresos. La resolución impugnada determina un ajuste al ISR del período fiscal 2024 por QUINIENTOS MIL LEMPIRAS.",
  "SENTENCIA DEFINITIVA\n\nJUZGADO DE FAMILIA\n\nEXPEDIENTE: FA-2025-0097\n\nEn la ciudad de Tegucigalpa, a los quince días del mes de agosto de dos mil veinticinco. Vistos los autos del proceso de SUCESIÓN INTESTADA promovido por los herederos de la señora María Elena Rodríguez.",
  "CONTRATO DE SERVICIOS PROFESIONALES\n\nEntre BANCO NACIONAL DE HONDURAS S.A. y el Despacho de Abogados Justicia Verdadera. El Despacho se obliga a prestar servicios de asesoría legal permanente en materia mercantil, laboral y contencioso-administrativa.",
  "PODER GENERAL DE REPRESENTACIÓN\n\nEn la ciudad de Tegucigalpa, a los diez días del mes de marzo de dos mil veintiséis. Ante mí, Notario Público, comparece el señor ANTONIO NÚÑEZ, quien otorga PODER GENERAL a favor del Dr. Ricardo Mendoza.",
  "PRUEBAS DOCUMENTALES\n\nDentro del proceso de DIVORCIO VOLUNTARIO, expediente FA-2026-0031, se presentan: Acta de matrimonio, certificaciones de nacimiento de los menores, estado de cuentas bancarias, escritura de propiedad del inmueble.",
  "INFORME PERICIAL DE INGENIERÍA\n\nEXPEDIENTE: CV-2026-0042\n\nSe realizó inspección ocular del inmueble. Hallazgos: fisuras en muros de carga con anchura superior a 3mm, humedad por capilaridad en muro perimetral.",
  "RECURSO DE INCONSTITUCIONALIDAD\n\nA LA SALA DE LO CONSTITUCIONAL\n\nInterpongo recurso contra el Decreto Ejecutivo número 45-2025 que regula tarifas notariales, excediendo las facultades reglamentarias del Poder Ejecutivo.",
  "CONTESTACIÓN DE DEMANDA MERCANTIL\n\nAL JUZGADO DE LETRAS MERCANTIL\n\nComparezco en representación de INVERSIONES DEL VALLE S.A. La parte actora reclama pago de facturas, pero los servicios facturados no fueron prestados conforme a lo pactado.",
  "INFORME LEGAL\n\nPARA: Dirección de Ingresos, SAR\n\nAnálisis jurídico del ajuste fiscal. El contribuyente presentó declaración jurada de ISR. La SAR determinó un ajuste de L. 500,000.00. Se recomienda interponer recurso de reconsideración.",
  "CONTRATO DE HONORARIOS\n\nEntre SEGUROS CENTROAMÉRICA S.A. y el Despacho. Honorarios de L. 15,000.00 mensuales más 10% sobre el monto recuperado en cada reclamación exitosa.",
  "DEMANDA LABORAL\n\nAL JUZGADO DE LETRAS DE TRABAJO\n\nComparezco en representación del señor CARLOS HERNÁNDEZ por DESPIDO INJUSTIFICADO. El trabajador laboró 15 años como Supervisor de Operaciones. Fue despedido sin causa justificada.",
  "INFORME PERICIAL CONTABLE\n\nEXPEDIENTE: PE-2025-0055\n\nAuditoría forense de estados financieros. Se identificaron irregularidades en cuentas por cobrar y pagos a proveedores no registrados.",
  "DEMANDA EJECUTIVA\n\nAL JUZGADO DE LETRAS MERCANTIL\n\nComparezco a interponer DEMANDA EJECUTIVA DE COBRO contra Inversiones del Valle S.A. por facturas impagadas que ascienden a CIENTO OCHENTA MIL LEMPIRAS.",
  "CONTRATO DE ARRENDAMIENTO\n\nEntre el propietario del inmueble ubicado en Col. Kennedy y el inquilino. Canon mensual de DOCE MIL LEMPIRAS. Plazo de 12 meses. Mora de más de 6 meses.",
  "DICTAMEN PERICIAL CONTABLE\n\nSe realizó análisis de los registros contables del período 2023-2025. Se detectaron diferencias en inventarios y cuentas por cobrar no registradas.",
  "ESCRITO DE MODIFICACIÓN\n\nAL JUZGADO DE FAMILIA\n\nSolicito modificación del régimen de visitas establecido. Han cambiado las circunstancias que motivaron la regulación anterior.",
  "CHEQUES PROTESTADOS\n\nSe presentan cheques números 00452, 00453 y 00454 del Banco Nacional de Honduras, protestados por falta de fondos. Monto total: CIENTO CINCUENTA MIL LEMPIRAS.",
  "DENUNCIA DE ACCIDENTE DE TRÁNSITO\n\nComparezco a denunciar accidente ocurrido el 15 de mayo de 2026 en Blvd Morazán. Vehículo conducido por el demandado impactó contra el vehículo del demandante.",
  "CONTRATO DE SOCIEDAD\n\nEntre los comparecientes se constituye una SOCIEDAD ANÓNIMA bajo la razón social de Farmacias Unidas S.A. Capital social de UN MILLÓN DE LEMPIRAS.",
  "PODER ESPECIAL\n\nLa señora CARMEN PAZ otorga PODER ESPECIAL al Dr. Ricardo Mendoza para que la represente en el proceso de divorcio.",
  "INFORME PERICIAL DE INGENIERÍA V2\n\nComplemento al informe pericial. Nuevas pruebas de laboratorio confirman la presencia de materiales defectuosos en la construcción.",
  "RECURSO DE APELACIÓN\n\nAL TRIBUNAL DE SEGUNDA INSTANCIA\n\nApelo la sentencia dictada por el Juzgado Civil en el caso de desalojo. La sentencia no valoró correctamente las pruebas presentadas.",
  "ACTA DE CONCILIACIÓN LABORAL\n\nEn la ciudad de San Pedro Sula, comparecen las partes asistidas por sus abogados. Se llega a acuerdo conciliatorio por la suma de CIEN MIL LEMPIRAS.",
  "PRUEBAS DOCUMENTALES — ACCIDENTE\n\nSe presentan: informe policial, fotografías del accidente, facturas de reparación del vehículo, dictamen médico de las lesiones sufridas.",
  "CONTRATO DE SERVICIOS — COMERCIAL NORTE\n\nComercial del Norte S.A. contrata al Despacho para cobro judicial de cartera vencida. Honorarios del 15% sobre el monto recuperado.",
  "DEMANDA DE NULIDAD\n\nAL JUZGADO CONTENCIOSO-ADMINISTRATIVO\n\nDemando la nulidad del acto administrativo de la alcaldía que deniega la licencia de construcción para el proyecto habitacional.",
  "INFORME LEGAL — ISR\n\nAnálisis de la declaración jurada de ISR de clientes corporativos. Se identificaron oportunidades de ahorro fiscal mediante deducciones permitidas.",
  "PODER GENERAL — FRANCISCO MORALES\n\nEl señor Francisco Morales otorga PODER GENERAL a favor de la Dra. Ana Lucía Torres para que lo represente en todos sus asuntos legales.",
];

const INVOICES_DATA = [
  { number: "FAC-2026-0001", status: "pagada" as const, amount: 15000, daysAgo: -120, due: -90, paid: -80 },
  { number: "FAC-2026-0007", status: "emitida" as const, amount: 22500, daysAgo: -30, due: 15, paid: null },
  { number: "FAC-2026-0012", status: "vencida" as const, amount: 8750, daysAgo: -60, due: -30, paid: null },
  { number: "FAC-2026-0018", status: "emitida" as const, amount: 42000, daysAgo: -15, due: 15, paid: null },
  { number: "FAC-2026-0023", status: "borrador" as const, amount: 18500, daysAgo: -5, due: 25, paid: null },
];

const NOTIFICATION_DATA = [
  { type: "plazo" as const, title: "Vence plazo de contestación", body: "El caso CV-2026-0042 tiene plazo de contestación que vence en 3 días.", channel: "in_app" as const, isRead: false, hoursAgo: -1 },
  { type: "vista" as const, title: "Vista programada para mañana", body: "Vista oral en el caso PE-2026-0018 programada para las 9:00 AM.", channel: "in_app" as const, isRead: false, hoursAgo: -2 },
  { type: "factura" as const, title: "Factura FAC-2026-0012 vencida", body: "La factura FAC-2026-0012 por L. 8,750 está vencida.", channel: "in_app" as const, isRead: false, hoursAgo: -4 },
  { type: "documento" as const, title: "Documento subido correctamente", body: "El documento 'Demanda ejecutiva' fue subido al caso ME-2026-0022.", channel: "in_app" as const, isRead: false, hoursAgo: -1 },
  { type: "sistema" as const, title: "Bienvenido al sistema", body: "Tu cuenta ha sido activada. Revisa la guía de inicio rápido.", channel: "in_app" as const, isRead: true, hoursAgo: -720 },
  { type: "audiencia" as const, title: "Audiencia de conciliación", body: "Audiencia programada para el caso laboral LA-2026-0012.", channel: "in_app" as const, isRead: false, hoursAgo: -6 },
  { type: "plazo" as const, title: "Vence pago de tasa de justicia", body: "Pago obligatorio de tasa de justicia para nuevo caso constitucional.", channel: "in_app" as const, isRead: false, hoursAgo: -8 },
  { type: "documento" as const, title: "Informe pericial recibido", body: "El informe pericial de ingeniería v2 ha sido añadido al caso CV-2026-0042.", channel: "in_app" as const, isRead: true, hoursAgo: -24 },
];

const TIME_DESCRIPTIONS = [
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

async function main() {
  const now = new Date();

  const existing = await db
    .select({ count: count() })
    .from(firms)
    .where(eq(firms.slug, DEMO_FIRM.slug));

  if (Number(existing[0]?.count ?? 0) > 0) {
    console.log("ℹ️  La firma demo ya existe. Omitiendo seed.");
    return;
  }

  // ─── FIRM ───
  const [firm] = await db.insert(firms).values(DEMO_FIRM).returning({ id: firms.id });
  const firmId = firm.id;
  console.log("✅ Firma demo creada");

  // ─── USERS ───
  const userIds: string[] = [];
  for (const u of DEMO_USERS) {
    const [user] = await db.insert(users).values({
      firmId,
      name: u.name,
      email: u.email,
      role: u.role,
      barNumber: u.barNumber,
      specialty: u.specialty,
    } as any).returning({ id: users.id });
    userIds.push(user.id);
  }
  console.log(`✅ ${userIds.length} usuarios creados`);

  // ─── CONTACTS ───
  const contactIds: string[] = [];
  for (const c of CLIENT_DATA) {
    const [rec] = await db.insert(contacts).values({
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
    } as any).returning({ id: contacts.id });
    contactIds.push(rec.id);
  }
  console.log(`✅ ${contactIds.length} contactos creados`);

  // ─── CASES ───
  const caseIds: string[] = [];
  for (let i = 0; i < CASES_DATA.length; i++) {
    const c = CASES_DATA[i];
    const [rec] = await db.insert(cases).values({
      firmId,
      number: c.number,
      courtNumber: c.courtNumber,
      title: c.title,
      description: c.description,
      matter: c.matter,
      status: c.status,
      priority: c.priority,
      assignedLawyerId: userIds[i % userIds.length],
      startDate: c.start,
      endDate: c.end,
      estimatedValue: c.estimatedValue,
    } as any).returning({ id: cases.id });
    caseIds.push(rec.id);
  }
  console.log(`✅ ${caseIds.length} casos creados`);

  // ─── CASE PARTIES ───
  for (let i = 0; i < caseIds.length; i++) {
    const mainIdx = i % contactIds.length;
    const otherIdx = (i + 1 + Math.floor(i / 3)) % contactIds.length;

    await db.insert(caseParties).values({
      caseId: caseIds[i],
      contactId: contactIds[mainIdx],
      role: "cliente",
      isMain: true,
    } as any);

    if (otherIdx !== mainIdx && i < 10) {
      await db.insert(caseParties).values({
        caseId: caseIds[i],
        contactId: contactIds[otherIdx],
        role: pick(["contraria", "testigo", "perito"] as const),
        isMain: false,
      } as any);
    }
  }
  console.log("✅ Partes de casos creadas");

  // ─── EVENTS ───
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
      createdBy: userIds[0],
    } as any);
  }
  console.log(`✅ ${EVENTS_DATA.length} eventos creados`);

  // ─── DOCUMENTS ───
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
      currentVersion: doc.status === "borrador" ? 1 : pick([1, 2, 3] as const),
      status: doc.status,
      ocrText: OCR_TEXTS[i % OCR_TEXTS.length] ?? null,
      processingStatus: "ocr_complete",
      createdBy: userIds[i % userIds.length],
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
    } as any).returning({ id: documents.id });

    await db.insert(documentVersions).values({
      documentId: d.id,
      version: 1,
      fileUrl: `https://storage.example.com/docs/${d.id}/v1`,
      fileKey: `${d.id}/v1`,
      fileSize: Math.floor(50000 + rng() * 500000),
      mimeType: pick(["application/pdf", "application/pdf", "image/png"] as const),
      createdBy: userIds[i % userIds.length],
    } as any);
  }
  console.log(`✅ ${DOCUMENTS_DATA.length} documentos creados`);

  // ─── TIME ENTRIES ───
  for (let i = 0; i < 20; i++) {
    const caseIdx = i % caseIds.length;
    const minutes = Math.floor(30 + rng() * 180);
    const startTime = new Date(now.getTime() - rng() * 60 * 86400000);

    await db.insert(timeEntries).values({
      caseId: caseIds[caseIdx],
      userId: userIds[caseIdx % userIds.length],
      description: `${TIME_DESCRIPTIONS[i % TIME_DESCRIPTIONS.length]}${i > 9 ? " (continuación)" : ""}`,
      startTime: startTime.toISOString(),
      endTime: new Date(startTime.getTime() + minutes * 60000).toISOString(),
      durationMinutes: minutes,
      hourlyRate: "1500",
      isBillable: rng() > 0.2,
      isInvoiced: i < 8,
    } as any);
  }
  console.log("✅ 20 registros de tiempo creados");

  // ─── INVOICES ───
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
      notes: i % 3 === 0 ? "Facturación mensual según contrato." : null,
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
        method: pick(["transferencia", "transferencia", "efectivo", "cheque"] as const),
        reference: `PAGO-${inv.number}`,
        notes: null,
        paidAt: paidDate.toISOString(),
      } as any);
    }
  }
  console.log(`✅ ${INVOICES_DATA.length} facturas creadas`);

  // ─── NOTIFICATIONS ───
  for (const n of NOTIFICATION_DATA) {
    await db.insert(notifications).values({
      firmId,
      userId: userIds[0],
      type: n.type,
      title: n.title,
      body: n.body,
      channel: n.channel,
      isRead: n.isRead,
      readAt: n.isRead ? new Date() : null,
      createdAt: new Date(Date.now() + n.hoursAgo * 3600000),
    } as any);
  }
  console.log(`✅ ${NOTIFICATION_DATA.length} notificaciones creadas`);

  console.log("\n📊 Resumen:");
  console.log(`   - 1 firma demo`);
  console.log(`   - ${userIds.length} usuarios`);
  console.log(`   - ${contactIds.length} contactos`);
  console.log(`   - ${caseIds.length} casos`);
  console.log(`   - ${EVENTS_DATA.length} eventos`);
  console.log(`   - ${DOCUMENTS_DATA.length} documentos`);
  console.log(`   - ${INVOICES_DATA.length} facturas`);
  console.log(`   - 20 time entries`);
  console.log(`   - ${NOTIFICATION_DATA.length} notificaciones`);
  console.log("\n✅ Seed completado exitosamente");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
