import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  date,
  numeric,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── FIRMS ─────────────────────────────────────
export const firms = pgTable(
  "firms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    logo: text("logo"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    address: text("address"),
    taxId: text("tax_id"),
    isvRate: numeric("isv_rate").default("15"),
    settings: jsonb("settings").$type<{ theme?: string; language?: string }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("firm_slug_idx").on(table.slug)]
);

// ─── USERS ─────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    emailVerified: timestamp("email_verified"),
    image: text("image"),
    role: text("role", {
      enum: ["owner", "admin", "lawyer", "assistant", "staff"],
    })
      .default("lawyer")
      .notNull(),
    barNumber: text("bar_number"),
    specialty: text("specialty"),
    phone: text("phone"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_firm_idx").on(table.firmId),
  ]
);

// ─── CASES ─────────────────────────────────────
export const cases = pgTable(
  "cases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    number: text("number").notNull(),
    courtNumber: text("court_number"),
    title: text("title").notNull(),
    description: text("description"),
    matter: text("matter", {
      enum: ["civil", "penal", "laboral", "familia", "mercantil", "contencioso", "constitucional"],
    }).notNull(),
    status: text("status", {
      enum: ["activo", "archivado", "cerrado", "suspendido"],
    })
      .default("activo")
      .notNull(),
    priority: text("priority", {
      enum: ["baja", "media", "alta", "urgente"],
    })
      .default("media")
      .notNull(),
    assignedLawyerId: uuid("assigned_lawyer_id").references(() => users.id),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    estimatedValue: numeric("estimated_value"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("case_firm_status_matter_idx").on(table.firmId, table.status, table.matter),
    index("case_firm_lawyer_idx").on(table.firmId, table.assignedLawyerId),
    uniqueIndex("case_firm_number_unique").on(table.firmId, table.number),
  ]
);

// ─── CONTACTS ──────────────────────────────────
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    type: text("type", {
      enum: ["persona_natural", "persona_juridica", "institucion"],
    })
      .default("persona_natural")
      .notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    companyName: text("company_name"),
    identityNumber: text("identity_number"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("contact_firm_idx").on(table.firmId),
    index("contact_firm_email_idx").on(table.firmId, table.email),
  ]
);

// ─── CASE PARTIES ──────────────────────────────
export const caseParties = pgTable(
  "case_parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    contactId: uuid("contact_id")
      .references(() => contacts.id)
      .notNull(),
    role: text("role", {
      enum: ["cliente", "contraria", "testigo", "perito", "juez", "fiscal", "otro"],
    }).notNull(),
    isMain: boolean("is_main").default(false),
    notes: text("notes"),
  },
  (table) => [index("case_party_case_idx").on(table.caseId)]
);

// ─── CASE EVENTS ───────────────────────────────
export const caseEvents = pgTable(
  "case_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type", {
      enum: ["vista", "audiencia", "plazo", "sentencia", "resolucion", "notificacion", "otro"],
    }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    date: timestamp("date").notNull(),
    endDate: timestamp("end_date"),
    location: text("location"),
    isCompleted: boolean("is_completed").default(false),
    notifiedAt: timestamp("notified_at"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("case_event_case_date_idx").on(table.caseId, table.date)]
);

// ─── DOCUMENTS ─────────────────────────────────
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    caseId: uuid("case_id").references(() => cases.id),
    name: text("name").notNull(),
    type: text("type", {
      enum: [
        "demanda",
        "contestacion",
        "recurso",
        "sentencia",
        "contrato",
        "poder",
        "prueba",
        "informe",
        "otro",
      ],
    })
      .default("otro")
      .notNull(),
    currentVersion: integer("current_version").default(1).notNull(),
    status: text("status", {
      enum: ["borrador", "final", "firmado", "archivado"],
    })
      .default("borrador")
      .notNull(),
    ocrText: text("ocr_text"),
    ocrConfidence: integer("ocr_confidence"),
    processingStatus: text("processing_status", {
      enum: ["pending", "uploaded", "ocr_processing", "ocr_complete", "ocr_skipped", "manual_review", "error", "retry_pending"],
    }).default("pending").notNull(),
    deletedAt: timestamp("deleted_at"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("document_firm_case_type_idx").on(table.firmId, table.caseId, table.type),
    index("idx_documents_ocr_text").using(
      "gin",
      sql`to_tsvector('spanish', coalesce(${table.ocrText}, ''))`
    ),
    index("idx_documents_ocr_simple").using(
      "gin",
      sql`to_tsvector('simple', coalesce(${table.ocrText}, ''))`
    ),
  ]
);

// ─── DOCUMENT VERSIONS ─────────────────────────
export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    version: integer("version").notNull(),
    fileUrl: text("file_url").notNull(),
    fileKey: text("file_key").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    changes: text("changes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("doc_version_unique").on(table.documentId, table.version),
  ]
);

// ─── DOCUMENT TEMPLATES ────────────────────────
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["demanda", "contestacion", "recurso", "contrato", "poder", "carta", "otro"],
  }).notNull(),
  matter: text("matter"),
  content: text("content").notNull(),
  isPublic: boolean("is_public").default(false),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ─── TIME ENTRIES ──────────────────────────────
export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    description: text("description").notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    durationMinutes: integer("duration_minutes"),
    hourlyRate: numeric("hourly_rate"),
    isBillable: boolean("is_billable").default(true),
    isInvoiced: boolean("is_invoiced").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("time_entry_case_user_idx").on(table.caseId, table.userId)]
);

// ─── INVOICES ──────────────────────────────────
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    caseId: uuid("case_id").references(() => cases.id),
    clientId: uuid("client_id")
      .references(() => contacts.id)
      .notNull(),
    number: text("number").notNull(),
    status: text("status", {
      enum: ["borrador", "emitida", "pagada", "anulada", "vencida"],
    })
      .default("borrador")
      .notNull(),
    subtotal: numeric("subtotal").notNull(),
    tax: numeric("tax").notNull(),
    total: numeric("total").notNull(),
    currency: text("currency").default("HNL").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invoice_firm_status_date_idx").on(table.firmId, table.status, table.dueDate),
    uniqueIndex("invoice_firm_number_unique").on(table.firmId, table.number),
  ]
);

// ─── INVOICE ITEMS ─────────────────────────────
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").default("1").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  total: numeric("total").notNull(),
  timeEntryId: uuid("time_entry_id").references(() => timeEntries.id),
});

// ─── PAYMENTS ──────────────────────────────────
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    amount: numeric("amount").notNull(),
    method: text("method", {
      enum: ["transferencia", "efectivo", "cheque", "tarjeta", "lemon_squeezy", "otro"],
    }).notNull(),
    reference: text("reference"),
    notes: text("notes"),
    paidAt: timestamp("paid_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("payment_firm_invoice_idx").on(table.firmId, table.invoiceId)]
);

// ─── NOTIFICATIONS ─────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    caseId: uuid("case_id").references(() => cases.id),
    type: text("type", {
      enum: ["plazo", "vista", "audiencia", "factura", "documento", "sistema", "mensaje"],
    }).notNull(),
    title: text("title").notNull(),
    body: text("body"),
    channel: text("channel", {
      enum: ["email", "whatsapp", "sms", "push", "in_app"],
    }).notNull(),
    isRead: boolean("is_read").default(false),
    sentAt: timestamp("sent_at"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_read_idx").on(table.userId, table.isRead, table.createdAt),
  ]
);

// ─── AUDIT LOGS ────────────────────────────────
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firmId: uuid("firm_id")
      .references(() => firms.id)
      .notNull(),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    changes: jsonb("changes").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("audit_log_created_at_idx").on(table.createdAt)]
);

// ─── NEXT AUTH ─────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    uniqueIndex("account_provider_unique").on(table.provider, table.providerAccountId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionToken: text("sessionToken").unique().notNull(),
    userId: uuid("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [index("session_token_idx").on(table.sessionToken)]
);

// ─── AI USAGE ─────────────────────────────────
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id")
    .references(() => firms.id)
    .notNull(),
  userId: uuid("user_id").references(() => users.id),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  cost: numeric("cost"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [uniqueIndex("vt_identifier_token").on(table.identifier, table.token)]
);
