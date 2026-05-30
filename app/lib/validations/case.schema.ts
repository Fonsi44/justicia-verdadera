import { z } from "zod";

export const caseCreateSchema = z.object({
  number: z.string().min(1, "El número de caso es requerido"),
  courtNumber: z.string().optional(),
  title: z.string().min(1, "El título es requerido").max(500, "Máximo 500 caracteres"),
  description: z.string().max(5000).optional(),
  matter: z.enum(["civil", "penal", "laboral", "familia", "mercantil", "contencioso", "constitucional", "otro"]),
  priority: z.enum(["alta", "media", "baja"]).optional(),
  assignedLawyerId: z.string().uuid().optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha de inicio inválida"),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha de fin inválida").optional(),
  estimatedValue: z.string().optional(),
});

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

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
