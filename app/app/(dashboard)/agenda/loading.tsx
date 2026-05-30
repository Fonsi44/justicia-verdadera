import { CardSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="p-4">
      <div className="h-8 bg-muted rounded w-64 animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
