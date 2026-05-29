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
    <div className="flex min-h-screen items-center justify-center bg-[#080b12]">
      <div className="glass-card mx-4 max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="font-display text-xl font-bold text-[#e8e4dd]">
          Error de autenticación
        </h1>
        <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2">
          <code className="text-sm text-[#c8a45c]">{error}</code>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[#8b8d91]">
          {errorMessages[error] ?? errorMessages.Default}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8a45c] px-6 py-2.5 text-sm font-medium text-[#080b12] hover:bg-[#d4b36a] transition-colors"
          >
            Volver al inicio de sesión
          </Link>
          <Link
            href="/"
            className="text-xs text-[#8b8d91] hover:text-[#e8e4dd] transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
