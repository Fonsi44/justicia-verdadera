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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="px-6 text-center">
        <p className="font-display text-8xl font-bold text-muted-foreground/20">
          500
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
          Error inesperado
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Ha ocurrido un error. Por favor, intenta de nuevo o contacta con
          soporte si el problema persiste.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button onClick={reset}>Reintentar</Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
