"use client"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Circle } from "lucide-react"
import type { ElementType } from "react"

interface ActivityItem {
  id: string
  icon?: ElementType
  title: string
  description?: string
  timestamp: string
  variant?: "default" | "success" | "warning" | "danger"
}

interface ActivityFeedProps {
  items: ActivityItem[]
  loading?: boolean
  maxItems?: number
  emptyMessage?: string
}

const dotColors: Record<string, string> = {
  default: "bg-muted-foreground",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
}

const iconBg: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon

  return (
    <li className="relative flex gap-3 pb-4 pl-6 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute left-2.5 top-2.5 -bottom-1 w-px bg-border last:hidden"
      />
      {Icon ? (
        <span
          className={cn(
            "relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full",
            iconBg[item.variant ?? "default"],
          )}
        >
          <Icon className="size-3" />
        </span>
      ) : (
        <span
          className={cn(
            "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ring-background",
            dotColors[item.variant ?? "default"],
          )}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {item.title}
          </p>
          <time className="shrink-0 text-xs text-muted-foreground">
            {item.timestamp}
          </time>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </li>
  )
}

function LoadingSkeletonItem() {
  return (
    <li className="flex gap-3 pb-4 pl-6">
      <Skeleton className="relative z-10 mt-1 size-2.5 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-16 shrink-0" />
        </div>
        <Skeleton className="h-3 w-64" />
      </div>
    </li>
  )
}

export default function ActivityFeed({
  items,
  loading,
  maxItems,
  emptyMessage = "No hay actividad reciente",
}: ActivityFeedProps) {
  const displayItems = maxItems ? items.slice(0, maxItems) : items

  if (loading) {
    return (
      <ul className="space-y-1" role="log" aria-label="Actividad reciente">
        {Array.from({ length: maxItems ?? 5 }).map((_, i) => (
          <LoadingSkeletonItem key={i} />
        ))}
      </ul>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Circle className="mb-2 size-8 text-muted-foreground/40" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  const hasMore = maxItems != null && items.length > maxItems

  return (
    <ul className="space-y-1" role="log" aria-label="Actividad reciente">
      {displayItems.map((item) => (
        <ActivityItemRow key={item.id} item={item} />
      ))}
      {hasMore && (
        <li className="pl-6 pt-1">
          <span className="cursor-pointer text-xs font-medium text-primary transition-colors hover:text-primary/80">
            Ver todas ({items.length - maxItems} más)
          </span>
        </li>
      )}
    </ul>
  )
}
