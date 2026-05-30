"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateCase } from "@/hooks/use-cases";
import PageHeader from "@/components/page-header";

const caseSchema = z.object({
  number: z.string().min(1, "El número de caso es requerido"),
  courtNumber: z.string().optional(),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  matter: z.string().min(1, "Seleccione una materia"),
  priority: z.string().optional(),
  assignedLawyerId: z.string().optional(),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  estimatedValue: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

const matterOptions = [
  { value: "civil", label: "Civil" },
  { value: "penal", label: "Penal" },
  { value: "laboral", label: "Laboral" },
  { value: "familia", label: "Familia" },
  { value: "mercantil", label: "Mercantil" },
  { value: "contencioso", label: "Contencioso" },
  { value: "constitucional", label: "Constitucional" },
];

const priorityOptions = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export default function NuevoCasoPage() {
  const router = useRouter();
  const createCase = useCreateCase();
  const [lawyers, setLawyers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/users?role=lawyer")
      .then((res) => res.json())
      .then(setLawyers)
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      priority: "media",
    },
  });

  const watchedMatter = useWatch({ control, name: "matter" });
  const watchedPriority = useWatch({ control, name: "priority" });
  const watchedAssignedLawyerId = useWatch({ control, name: "assignedLawyerId" });

  const onSubmit = async (data: CaseFormData) => {
    try {
      const result = await createCase.mutateAsync(data as Record<string, unknown>);
      toast.success("Caso creado exitosamente");
      router.push(`/casos/${result.id}`);
    } catch {
      toast.error("Error al crear el caso");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nuevo caso"
        description="Crea un nuevo expediente en tu despacho."
        breadcrumbs={[
          { label: "Casos", href: "/casos" },
          { label: "Nuevo caso" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="rounded-xl border bg-card shadow-sm p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number">Número de caso *</Label>
              <Input
                id="number"
                placeholder="Ej: CV-2026-0100"
                {...register("number")}
              />
              {errors.number && (
                <p className="text-xs text-red-600">{errors.number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="courtNumber">Número de juzgado</Label>
              <Input
                id="courtNumber"
                placeholder="Ej: J-001-2026"
                {...register("courtNumber")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ej: Pérez vs. Constructora S.A."
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el caso..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Materia *</Label>
              <Select
                value={watchedMatter}
                onValueChange={(v) => setValue("matter", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona materia" />
                </SelectTrigger>
                <SelectContent>
                  {matterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.matter && (
                <p className="text-xs text-red-600">{errors.matter.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={watchedPriority}
                onValueChange={(v) => setValue("priority", v ?? "media")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-xs text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedLawyerId">Abogado asignado</Label>
              <Select
                value={watchedAssignedLawyerId}
                onValueChange={(v) => setValue("assignedLawyerId", v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona abogado" />
                </SelectTrigger>
                <SelectContent>
                  {lawyers.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={lawyer.id}>
                      {lawyer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Valor estimado (HNL)</Label>
            <Input
              id="estimatedValue"
              type="number"
              placeholder="Ej: 250000"
              {...register("estimatedValue")}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={createCase.isPending}
            >
              {createCase.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear caso"
              )}
            </Button>
            <Button render={<Link href="/casos" />} variant="outline" nativeButton={false}>
              Cancelar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
