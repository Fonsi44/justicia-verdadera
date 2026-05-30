"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight } from "lucide-react"

interface SectionCardProps {
  title?: string
  description?: string
  action?: { label: string; href: string }
  children: React.ReactNode
  className?: string
  loading?: boolean
}

export default function SectionCard({
  title,
  description,
  action,
  children,
  className,
  loading,
}: SectionCardProps) {
  if (loading) {
    return (
      <Card className={cn("p-6", className)}>
        {title && (
          <div className="mb-4 space-y-2">
            <Skeleton className="h-5 w-48" />
            {description && <Skeleton className="h-4 w-72" />}
          </div>
        )}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-0", className)}>
      {title && (
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {action && (
              <Link
                href={action.href}
                className="mt-0.5 flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                {action.label}
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
