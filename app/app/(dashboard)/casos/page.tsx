import { Suspense } from "react";
import { CasesClient } from "./_client";

export default function CasosPage() {
  return (
    <div className="space-y-8">
      <Suspense
        fallback={
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
        }
      >
        <CasesClient />
      </Suspense>
    </div>
  );
}
