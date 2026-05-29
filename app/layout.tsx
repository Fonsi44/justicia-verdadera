import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/components/posthog-provider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Justicia Verdadera — Gestión Legal con Inteligencia Artificial",
    template: "%s | Justicia Verdadera",
  },
  description:
    "Plataforma SaaS de gestión integral para despachos de abogados en Honduras. Expedientes, documentos, facturación, agenda e IA jurídica integrada.",
  keywords: [
    "software legal Honduras",
    "gestión despachos abogados",
    "IA jurídica",
    "SaaS legal",
    "expedientes judiciales",
    "Justicia Verdadera",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${dmSans.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-body">
        <PostHogProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </PostHogProvider>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
