"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "Error de configuración del proveedor OAuth. Verifica las credenciales y el redirect URI en Google Cloud Console.",
  AccessDenied: "Acceso denegado. No autorizaste el inicio de sesión.",
  Verification: "El token de verificación ha expirado o ya fue usado.",
  OAuthSignin: "Error al iniciar el flujo OAuth. Intenta de nuevo.",
  OAuthCallback: "Error en el callback OAuth. El redirect URI puede no coincidir.",
  OAuthCreateAccount: "No se pudo crear la cuenta. Intenta con otro método.",
  EmailCreateAccount: "No se pudo crear la cuenta con ese email.",
  Callback: "Error en el callback de autenticación.",
  OAuthAccountNotLinked: "Esta cuenta ya está vinculada a otro método de inicio de sesión.",
  EmailSignin: "Error al enviar el email de verificación.",
  CredentialsSignin: "Credenciales inválidas.",
  SessionRequired: "Debes iniciar sesión para acceder.",
  Default: "Error desconocido durante la autenticación.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 mx-4 max-w-md animate-fade-in-up rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>

        <h1 className="font-display text-xl font-bold text-foreground">
          Error de autenticación
        </h1>

        <div className="mt-2 inline-block rounded-lg border border-border px-4 py-2">
          <code className="text-sm text-muted-foreground">{error}</code>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {errorMessages[error] ?? errorMessages.Default}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Volver al inicio de sesión
          </Link>
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
