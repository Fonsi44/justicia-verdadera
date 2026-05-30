"use client"

import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral"
  size?: "sm" | "md"
  dot?: boolean
}

const statusVariantMap: Record<string, string> = {
  active: "success",
  completado: "success",
  pagado: "success",
  resuelto: "success",
  pendiente: "warning",
  revisión: "warning",
  progreso: "warning",
  vencido: "danger",
  anulado: "danger",
  cancelado: "danger",
  archivado: "neutral",
  inactivo: "neutral",
  borrador: "neutral",
}

const variantStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-700",
  warning: "bg-amber-500/10 text-amber-700",
  danger: "bg-red-500/10 text-red-700",
  info: "bg-sky-500/10 text-sky-700",
  neutral: "bg-muted text-muted-foreground",
}

const dotColors: Record<string, string> = {
  default: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-muted-foreground",
}

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-0.5 text-[11px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
}

const dotSizes: Record<string, string> = {
  sm: "size-1.5",
  md: "size-2",
}

export default function StatusBadge({
  status,
  variant,
  size = "sm",
  dot = false,
}: StatusBadgeProps) {
  const resolvedVariant = variant ?? statusVariantMap[status.toLowerCase()] ?? "default"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium leading-none",
        variantStyles[resolvedVariant],
        sizeStyles[size],
      )}
    >
      {dot && (
        <span
          className={cn(
            "inline-block rounded-full",
            dotColors[resolvedVariant],
            dotSizes[size],
          )}
        />
      )}
      {status}
    </span>
  )
}
