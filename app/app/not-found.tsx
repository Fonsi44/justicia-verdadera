import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="px-6 text-center">
        <p className="font-display text-8xl font-bold text-muted-foreground/20">
          404
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">
          P&aacute;gina no encontrada
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          La p&aacute;gina que buscas no existe o ha sido movida. Verifica la
          URL o vuelve al inicio.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
