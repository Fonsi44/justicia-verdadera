"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Inbox } from "lucide-react"
import type { ElementType } from "react"

interface EmptyStateProps {
  icon?: ElementType
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  size?: "sm" | "md" | "lg"
}

const sizeStyles = {
  sm: "py-8 gap-2",
  md: "py-16 gap-3",
  lg: "py-24 gap-4",
}

const iconSizes = {
  sm: "size-10",
  md: "size-14",
  lg: "size-20",
}

const titleSizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeStyles[size],
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          iconSizes[size],
        )}
      >
        <Icon className={cn(size === "sm" ? "size-5" : size === "lg" ? "size-10" : "size-7")} />
      </span>
      <h3
        className={cn(
          "font-display font-semibold text-foreground",
          titleSizes[size],
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          {action.href ? (
            <Button render={<Link href={action.href} />} nativeButton={false}>
              {action.label}
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
