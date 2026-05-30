import { DashboardSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="p-4">
      <div className="h-8 bg-muted rounded w-48 animate-pulse mb-6" />
      <DashboardSkeleton />
    </div>
  );
}
