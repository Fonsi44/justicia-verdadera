"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary transition-colors group-hover:bg-primary/90">
            <span className="font-display text-sm font-bold text-primary-foreground">JV</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-wide text-foreground">
            Justicia Verdadera
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-xl font-bold text-foreground text-center">
            Acceder a la plataforma
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Elige tu método de acceso
          </p>

          <div className="mt-8 space-y-3">
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl border-border bg-white text-sm hover:bg-muted"
              onClick={() => handleSignIn("google")}
              disabled={!!loading}
            >
              {loading === "google" ? (
                <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continuar con Google
            </Button>

            <Button
              variant="outline"
              className="h-12 w-full rounded-xl border-border bg-white text-sm hover:bg-muted"
              onClick={() => handleSignIn("microsoft-entra-id")}
              disabled={!!loading}
            >
              {loading === "microsoft-entra-id" ? (
                <Loader2 className="mr-3 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.55 1H1v10.55h10.55V1z" fill="#F25022" />
                  <path d="M23 1H12.45v10.55H23V1z" fill="#7FBA00" />
                  <path d="M11.55 12.45H1V23h10.55V12.45z" fill="#00A4EF" />
                  <path d="M23 12.45H12.45V23H23V12.45z" fill="#FFB900" />
                </svg>
              )}
              Continuar con Microsoft
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Al acceder, aceptas nuestros términos de servicio y política de
            privacidad.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
