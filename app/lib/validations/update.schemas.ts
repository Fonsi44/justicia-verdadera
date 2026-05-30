import { z } from "zod";

export const caseUpdateSchema = z.object({
  number: z.string().min(1).optional(),
  courtNumber: z.string().optional(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  matter: z.enum(["civil", "penal", "laboral", "familia", "mercantil", "contencioso", "constitucional", "otro"]).optional(),
  status: z.enum(["activo", "archivado", "cerrado"]).optional(),
  priority: z.enum(["alta", "media", "baja"]).optional(),
  assignedLawyerId: z.string().uuid().optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  estimatedValue: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const contactUpdateSchema = z.object({
  type: z.enum(["persona_natural", "persona_juridica", "institucion"]).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  identityNumber: z.string().max(50).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
});

export const documentUpdateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  type: z.enum(["demanda", "contestacion", "recurso", "sentencia", "contrato", "poder", "prueba", "informe", "otro"]).optional(),
  status: z.string().optional(),
  caseId: z.string().uuid().optional(),
  currentVersion: z.number().int().positive().optional(),
});

export const invoiceUpdateSchema = z.object({
  caseId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  number: z.string().min(1).optional(),
  issueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["borrador", "emitida", "pagada", "anulada", "vencida"]).optional(),
  cai: z.string().optional(),
  rtnEmisor: z.string().optional(),
  rtnReceptor: z.string().optional(),
});

export const eventUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida").optional(),
  location: z.string().max(300).optional(),
  type: z.enum(["vista", "audiencia", "vencimiento", "reunion", "resolucion", "notificacion", "otro"]).optional(),
  isCompleted: z.boolean().optional(),
});
