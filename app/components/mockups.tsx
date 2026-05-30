import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MockupFrameProps {
  children: ReactNode
  variant?: "browser" | "mobile"
  className?: string
}

export function MockupFrame({ children, variant = "browser", className }: MockupFrameProps) {
  if (variant === "mobile") {
    return (
      <div className={cn("relative mx-auto w-[280px]", className)}>
        <div className="rounded-[2.5rem] border-4 border-border bg-card shadow-xl shadow-black/5">
          <div className="relative flex items-center justify-center pt-4 pb-2">
            <div className="h-5 w-28 rounded-full bg-muted" />
          </div>
          <div className="overflow-hidden rounded-b-[2.25rem] bg-background">
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="rounded-lg border border-border bg-card shadow-xl shadow-black/5 overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-[#e74c3c] opacity-80" />
          <div className="h-3 w-3 rounded-full bg-[#f1c40f] opacity-80" />
          <div className="h-3 w-3 rounded-full bg-[#2ecc71] opacity-80" />
          <div className="ml-4 flex-1 rounded-md bg-muted px-3 py-1.5">
            <div className="h-3 w-48 rounded bg-muted-foreground/10" />
          </div>
        </div>
        <div className="bg-background">
          {children}
        </div>
      </div>
    </div>
  )
}

export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full bg-background text-[10px]", className)}>
      <div className="flex h-full w-full">
        <div className="flex w-48 flex-shrink-0 flex-col border-r border-border bg-card p-3">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-border bg-primary/10">
              <span className="text-[8px] font-bold text-primary">JV</span>
            </div>
            <span className="text-[11px] font-semibold text-foreground">Justicia Verdadera</span>
          </div>
          {["Expedientes", "Clientes", "Documentos", "Agenda", "Facturación"].map((item, i) => (
            <div
              key={item}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]",
                i === 0
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              <div className={cn("h-3.5 w-3.5 rounded", i === 0 ? "bg-primary/20" : "bg-muted")} />
              {item}
            </div>
          ))}
          <div className="mt-auto border-t border-border pt-3">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground">
              <div className="h-3.5 w-3.5 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-2 w-16 rounded bg-muted" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="mt-1 h-2 w-20 rounded bg-muted-foreground/10" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-md bg-primary/10" />
              <div className="h-7 w-24 rounded-md border border-border" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "128", label: "Casos activos", color: "bg-primary/10" },
              { value: "45", label: "Clientes", color: "bg-[#0d9488]/10" },
              { value: "8", label: "Vencimientos", color: "bg-[#c08060]/10" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-3">
                <div className={cn("mb-2 h-6 w-6 rounded", stat.color)} />
                <div className="text-sm font-semibold text-foreground">{stat.value}</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-3 h-3 w-20 rounded bg-muted" />
              <div className="flex items-end gap-1.5 h-24">
                {[70, 45, 85, 55, 40, 65, 50].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${h}%`,
                      background: i === 2 ? "#0d9488" : "#1e3a5f",
                      opacity: i === 2 ? 0.8 : 0.12,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-3 h-3 w-24 rounded bg-muted" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#0d9488] opacity-40" />
                  <div className="h-2 flex-1 rounded bg-muted" />
                  <div className="h-2 w-12 rounded bg-muted-foreground/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
