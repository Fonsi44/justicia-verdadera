import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#080b12]">
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />
      <div className="relative z-10 text-center px-6">
        <p className="font-display text-8xl font-bold text-white/[0.03]">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-[#e8e4dd]">
          Página no encontrada
        </h1>
        <p className="mt-3 text-[#8b8d91] max-w-md mx-auto">
          La página que buscas no existe o ha sido movida. Verifica la URL o
          vuelve al inicio.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button className="bg-[#c8a45c] text-[#080b12] hover:bg-[#d4b36a]">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
