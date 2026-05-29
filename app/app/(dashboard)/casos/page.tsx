import { Suspense } from "react";
import { CasesClient } from "./_client";

export default function CasosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">
          Casos
        </h1>
        <p className="mt-1 text-sm text-[#8b8d91]">
          Gestiona los casos y expedientes de tu despacho.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="glass-card p-6">
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#c8a45c] border-t-transparent" />
            </div>
          </div>
        }
      >
        <CasesClient />
      </Suspense>
    </div>
  );
}
