"use client"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "list" | "text" | "stat-cards"
  count?: number
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 ring-1 ring-foreground/10">
      <div className="mb-4 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 border-b pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

function TextSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === count - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  )
}

export default function LoadingSkeleton({
  variant = "text",
  count = 1,
}: LoadingSkeletonProps) {
  switch (variant) {
    case "card":
      return <CardSkeleton />
    case "table":
      return <TableSkeleton />
    case "list":
      return <ListSkeleton />
    case "stat-cards":
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: count || 4 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse flex-col gap-3 rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="size-10 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )
    case "text":
    default:
      return <TextSkeleton count={count} />
  }
}
