"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { ElementType } from "react"

interface StatCardProps {
  label: string
  value: string | number
  icon: ElementType
  subtitle?: string
  loading?: boolean
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  href?: string
  index?: number
}

const iconBg: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
}

const borderAccent: Record<string, string> = {
  default: "",
  primary: "border-l-primary/30",
  success: "border-l-emerald-500/30",
  warning: "border-l-amber-500/30",
  danger: "border-l-red-500/30",
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  subtitle,
  loading,
  variant = "default",
  href,
  index = 0,
}: StatCardProps) {
  const animationStyle = {
    "--stagger": index,
    animationDelay: `${index * 0.1}s`,
  } as React.CSSProperties

  if (loading) {
    return (
      <div
        className="flex animate-fade-in-up flex-col gap-3 rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
        style={animationStyle}
      >
        <div className="flex items-start justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="size-10 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    )
  }

  const content = (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-xl border bg-card p-5 ring-1 ring-foreground/10 transition-all duration-300",
        borderAccent[variant],
        href && "cursor-pointer hover:-translate-y-0.5 hover:ring-2 hover:ring-primary/20",
      )}
      style={animationStyle}
    >
      <div className="flex items-start justify-between">
        <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            iconBg[variant],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
      {subtitle && (
        <span className="text-xs text-muted-foreground/70">{subtitle}</span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} aria-label={`Ver ${label}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}
