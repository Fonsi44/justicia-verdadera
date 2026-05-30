import { Suspense } from "react";
import { CaseDetailClient } from "./_client";

export default function CasoDetailPage() {
  return (
    <div className="space-y-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <CaseDetailClient />
      </Suspense>
    </div>
  );
}
