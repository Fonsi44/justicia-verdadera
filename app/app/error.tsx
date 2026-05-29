"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#080b12]">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />
      <div className="relative z-10 text-center px-6">
        <p className="font-display text-8xl font-bold text-white/[0.03]">
          500
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-[#e8e4dd]">
          Error inesperado
        </h1>
        <p className="mt-3 text-[#8b8d91] max-w-md mx-auto">
          Ha ocurrido un error. Por favor, intenta de nuevo o contacta con
          soporte si el problema persiste.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button onClick={reset} className="bg-[#c8a45c] text-[#080b12] hover:bg-[#d4b36a]">
            Reintentar
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-white/[0.08] text-[#e8e4dd] hover:bg-white/[0.03]"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
