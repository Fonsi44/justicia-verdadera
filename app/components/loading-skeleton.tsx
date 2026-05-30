export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-8 bg-muted rounded"
              style={{ flex: j === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3 animate-pulse">
      <div className="h-5 bg-muted rounded w-1/3" />
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-10 bg-muted rounded w-full mt-4" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-40 bg-muted rounded" />
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingSkeleton({
  variant = "table",
  rows = 6,
  cols = 4,
}: {
  variant?: "table" | "list" | "card";
  rows?: number;
  cols?: number;
}) {
  if (variant === "card") return <CardSkeleton />;
  if (variant === "list") {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }
  return <TableSkeleton rows={rows} cols={cols} />;
}
