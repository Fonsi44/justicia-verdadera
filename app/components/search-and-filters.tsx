"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface FilterChip {
  label: string
  value: string
  count?: number
}

interface SearchAndFiltersProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: FilterChip[]
  activeFilter?: string
  onFilterChange?: (value: string) => void
  actions?: React.ReactNode
  loading?: boolean
}

export default function SearchAndFilters({
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
  actions,
  loading,
}: SearchAndFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-8"
            disabled={loading}
            aria-label={searchPlaceholder}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {filters && filters.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Filtros"
        >
          <button
            role="tab"
            aria-selected={!activeFilter || activeFilter === "all"}
            onClick={() => onFilterChange?.("all")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              (!activeFilter || activeFilter === "all")
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            Todos
          </button>
          {filters.map((filter) => (
            <button
              key={filter.value}
              role="tab"
              aria-selected={activeFilter === filter.value}
              onClick={() => onFilterChange?.(filter.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span
                  className={cn(
                    "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-semibold",
                    activeFilter === filter.value
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted-foreground/10 text-muted-foreground",
                  )}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
