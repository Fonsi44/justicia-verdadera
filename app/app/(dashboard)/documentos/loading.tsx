import { TableSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-9 bg-muted rounded w-32 animate-pulse" />
      </div>
      <TableSkeleton rows={6} cols={4} />
    </div>
  );
}
