export type CaseMatter =
  | "civil"
  | "penal"
  | "laboral"
  | "familia"
  | "mercantil"
  | "contencioso"
  | "constitucional";

export type CaseStatus = "activo" | "archivado" | "cerrado" | "suspendido";
export type CasePriority = "baja" | "media" | "alta" | "urgente";

export type ContactType =
  | "persona_natural"
  | "persona_juridica"
  | "institucion";

export type PartyRole =
  | "cliente"
  | "contraria"
  | "testigo"
  | "perito"
  | "juez"
  | "fiscal"
  | "otro";

export type EventType =
  | "vista"
  | "audiencia"
  | "plazo"
  | "sentencia"
  | "resolucion"
  | "notificacion"
  | "otro";

export type DocumentType =
  | "demanda"
  | "contestacion"
  | "recurso"
  | "sentencia"
  | "contrato"
  | "poder"
  | "prueba"
  | "informe"
  | "otro";

export type DocumentStatus =
  | "borrador"
  | "final"
  | "firmado"
  | "archivado";

export type InvoiceStatus =
  | "borrador"
  | "emitida"
  | "pagada"
  | "anulada"
  | "vencida";

export type PaymentMethod =
  | "transferencia"
  | "efectivo"
  | "cheque"
  | "tarjeta"
  | "stripe"
  | "otro";

export type NotificationChannel =
  | "email"
  | "whatsapp"
  | "sms"
  | "push"
  | "in_app";

export type UserRole = "owner" | "admin" | "lawyer" | "assistant" | "staff";

export interface CaseData {
  id: string;
  firmId: string;
  number: string;
  courtNumber: string | null;
  title: string;
  description: string | null;
  matter: CaseMatter;
  status: CaseStatus;
  priority: CasePriority;
  assignedLawyerId: string | null;
  startDate: string;
  endDate: string | null;
  estimatedValue: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  assignedLawyer?: { id: string; name: string } | null;
  parties?: CasePartyData[];
  eventCount?: number;
  documentCount?: number;
}

export interface ContactData {
  id: string;
  firmId: string;
  type: ContactType;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  identityNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  caseCount?: number;
}

export interface CasePartyData {
  id: string;
  caseId: string;
  contactId: string;
  role: PartyRole;
  isMain: boolean;
  notes: string | null;
  contact?: ContactData;
}

export interface EventData {
  id: string;
  caseId: string;
  type: EventType;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  isCompleted: boolean;
  notifiedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  case?: { id: string; number: string; title: string } | null;
}

export interface DocumentData {
  id: string;
  firmId: string;
  caseId: string | null;
  name: string;
  type: DocumentType;
  currentVersion: number;
  status: DocumentStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  case?: { id: string; number: string; title: string } | null;
}

export interface InvoiceData {
  id: string;
  firmId: string;
  caseId: string | null;
  clientId: string;
  number: string;
  status: InvoiceStatus;
  subtotal: string;
  tax: string;
  total: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  client?: { id: string; firstName: string | null; lastName: string | null; companyName: string | null } | null;
}

export interface TimeEntryData {
  id: string;
  caseId: string;
  userId: string;
  description: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  hourlyRate: string | null;
  isBillable: boolean;
  isInvoiced: boolean;
  createdAt: string;
}

export interface DashboardStats {
  activeCases: number;
  upcomingEvents: number;
  pendingInvoices: number;
  pendingAmount: string;
  billableHours: number;
  totalContacts: number;
  totalDocuments: number;
  recentCases: CaseData[];
  upcomingDeadlines: EventData[];
  casesByMatter: Array<{ name: string; value: number }>;
  monthlyActivity: Array<{ name: string; casos: number; docs: number }>;
  currentSpending: string;
  spendingLimit: string;
  isvRate: number;
}

export interface FirmData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  taxId: string | null;
  settings: Record<string, unknown> | null;
}
