import { z } from "zod";

export const contactCreateSchema = z.object({
  type: z.enum(["persona_natural", "persona_juridica", "institucion"]),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  identityNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

export const documentCreateSchema = z.object({
  caseId: z.string().uuid().optional(),
  name: z.string().min(1, "El nombre es requerido").max(500),
  type: z.enum(["demanda", "contestacion", "recurso", "sentencia", "contrato", "poder", "prueba", "informe", "otro"]).optional(),
  mimeType: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
});

export const eventCreateSchema = z.object({
  caseId: z.string().uuid("El caso es requerido"),
  type: z.enum(["vista", "audiencia", "vencimiento", "reunion", "resolucion", "notificacion", "otro"]),
  title: z.string().min(1, "El título es requerido").max(500),
  description: z.string().max(2000).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha fin inválida").optional(),
  location: z.string().max(300).optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

export const invoiceCreateSchema = z.object({
  caseId: z.string().uuid().optional(),
  clientId: z.string().uuid("El cliente es requerido"),
  number: z.string().min(1, "Número de factura requerido"),
  issueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha de emisión inválida"),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha de vencimiento inválida"),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Descripción requerida"),
    quantity: z.string().optional(),
    unitPrice: z.string().optional(),
  })).optional(),
});

export const timeEntryCreateSchema = z.object({
  caseId: z.string().uuid("El caso es requerido"),
  description: z.string().min(1, "La descripción es requerida").max(2000),
  startTime: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inicio inválida"),
  endTime: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha fin inválida").optional(),
  durationMinutes: z.number().int().positive().optional(),
  hourlyRate: z.string().optional(),
  isBillable: z.boolean().optional(),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type TimeEntryCreateInput = z.infer<typeof timeEntryCreateSchema>;
