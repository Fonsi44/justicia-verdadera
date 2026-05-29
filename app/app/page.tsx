"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ScaleIcon,
  AIIcon,
  DocumentIcon,
  CalendarIcon,
  BillingIcon,
  SecurityIcon,
} from "@/components/illustrations";
import { useEffect, useRef, useState } from "react";

function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

const features = [
  {
    icon: ScaleIcon,
    title: "Gestión de Expedientes",
    description:
      "Control total de casos con línea de tiempo cronológica, estados configurables y alertas inteligentes de plazos procesales.",
  },
  {
    icon: AIIcon,
    title: "Asistente IA Jurídico",
    description:
      "Chatea con tus expedientes, genera borradores de escritos al instante y analiza jurisprudencia relevante con DeepSeek V4.",
  },
  {
    icon: DocumentIcon,
    title: "Gestión Documental Inteligente",
    description:
      "Plantillas que se rellenan automáticamente con los datos del caso. Control de versiones y firma electrónica integrada.",
  },
  {
    icon: CalendarIcon,
    title: "Agenda y Calendario",
    description:
      "Vistas, audiencias y plazos sincronizados con Google Calendar. Recordatorios automáticos multicanal.",
  },
  {
    icon: BillingIcon,
    title: "Facturación y Cobros",
    description:
      "Honorarios, facturas SAR-compliant, horas facturables y cuentas por cobrar. Todo en un solo lugar.",
  },
  {
    icon: SecurityIcon,
    title: "Portal del Cliente",
    description:
      "Acceso seguro para que tus clientes consulten el estado de sus casos, documentos y facturas en tiempo real.",
  },
];

const stats = [
  { value: "100%", label: "Adaptado a Honduras" },
  { value: "0", label: "Competidores con IA" },
  { value: "24/7", label: "Disponibilidad cloud" },
  { value: "14d", label: "Prueba gratuita" },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#080b12]">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid pointer-events-none z-0" />
      <div className="fixed inset-0 bg-noise pointer-events-none z-0" />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#c8a45c] opacity-[0.03] blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#7ea8c4] opacity-[0.04] blur-[150px] pointer-events-none z-0" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#080b12]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c8a45c]/20 bg-[#c8a45c]/10 transition-colors group-hover:border-[#c8a45c]/40">
              <span className="font-display text-sm font-bold text-[#c8a45c]">
                JV
              </span>
            </div>
            <span className="font-display text-base font-semibold text-[#e8e4dd] tracking-wide hidden sm:block">
              Justicia Verdadera
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["Funcionalidades", "Precios", "Blog"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-[#8b8d91] hover:text-[#e8e4dd] transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#8b8d91] hover:text-[#e8e4dd] hover:bg-white/[0.04]"
              >
                Acceder
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                size="sm"
                className="bg-[#c8a45c] text-[#080b12] hover:bg-[#d4b36a] font-medium shadow-lg shadow-[#c8a45c]/10"
              >
                Prueba gratuita
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ─── Hero ──────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-28">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[800px] rounded-full bg-gradient-radial from-[#c8a45c]/5 via-transparent to-transparent opacity-60" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c8a45c]/15 bg-[#c8a45c]/5 px-4 py-1.5 text-xs font-medium text-[#c8a45c] mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a45c] opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8a45c]" />
              </span>
              Lanzamiento en Honduras — Acceso anticipado
            </div>

            <h1 className="mx-auto max-w-5xl font-display text-5xl font-bold tracking-tight text-[#e8e4dd] sm:text-7xl lg:text-8xl leading-[1.05] animate-fade-in-up">
              El despacho legal
              <br />
              <span className="gradient-gold">impulsado por IA</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#8b8d91] animate-fade-in-up stagger-1">
              La primera plataforma integral diseñada específicamente para
              abogados hondureños. Gestión de casos, automatización documental,
              facturación e inteligencia artificial jurídica en una sola
              herramienta.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-2">
              <Link href="/auth/signin">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base bg-[#c8a45c] text-[#080b12] hover:bg-[#d4b36a] font-semibold shadow-xl shadow-[#c8a45c]/10 transition-all duration-300 hover:shadow-2xl hover:shadow-[#c8a45c]/20 hover:-translate-y-0.5"
                >
                  Comenzar prueba gratuita de 14 días
                </Button>
              </Link>
              <Link href="#funcionalidades">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-base border-white/[0.08] text-[#e8e4dd] hover:bg-white/[0.03] hover:border-white/[0.12]"
                >
                  Explorar funcionalidades
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-[#8b8d91]/60 animate-fade-in stagger-3">
              Sin tarjeta de crédito. Cancela cuando quieras.
            </p>
          </div>
        </section>

        {/* ─── Stats Bar ─────────────────────── */}
        <section className="border-y border-white/[0.04] bg-white/[0.01]">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 100}>
                  <div className="text-center">
                    <div className="font-display text-3xl font-bold text-[#e8e4dd] sm:text-4xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-[#8b8d91]">
                      {stat.label}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ──────────────────────── */}
        <section id="funcionalidades" className="py-32">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-20">
                <p className="text-sm font-medium tracking-widest text-[#c8a45c] uppercase mb-4">
                  Funcionalidades
                </p>
                <h2 className="font-display text-4xl font-bold text-[#e8e4dd] sm:text-5xl">
                  Todo lo que tu despacho{" "}
                  <span className="gradient-gold">necesita</span>
                </h2>
                <p className="mt-4 text-lg text-[#8b8d91] max-w-2xl mx-auto">
                  Una plataforma integral que reemplaza todas tus herramientas
                  actuales. Diseñada para abogados hondureños, construida con
                  tecnología de vanguardia.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <ScrollReveal key={feature.title} delay={i * 100}>
                  <div className="glass-card glass-card-hover p-8 h-full group">
                    <div className="mb-6 w-14 h-14 flex items-center justify-center">
                      <feature.icon className="w-12 h-12" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#e8e4dd] mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#8b8d91]">
                      {feature.description}
                    </p>
                    <div className="mt-6 h-px w-8 bg-[#c8a45c]/30 transition-all duration-500 group-hover:w-16 group-hover:bg-[#c8a45c]/60" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────── */}
        <section className="py-32 border-t border-white/[0.04]">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-20">
                <p className="text-sm font-medium tracking-widest text-[#7ea8c4] uppercase mb-4">
                  Cómo funciona
                </p>
                <h2 className="font-display text-4xl font-bold text-[#e8e4dd] sm:text-5xl">
                  De Excel a{" "}
                  <span className="gradient-gold">inteligencia artificial</span>{" "}
                  en minutos
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Crea tu despacho",
                  description:
                    "Regístrate en 30 segundos. Configura tu firma, invita a tu equipo y personaliza los flujos de trabajo.",
                },
                {
                  step: "02",
                  title: "Importa tus casos",
                  description:
                    "Carga tus expedientes activos, clientes y documentos. Nuestra IA los organiza automáticamente.",
                },
                {
                  step: "03",
                  title: "Deja que la IA trabaje",
                  description:
                    "Redacta escritos, analiza plazos y recibe alertas inteligentes. Concéntrate en lo que importa: tus clientes.",
                },
              ].map((item, i) => (
                <ScrollReveal key={item.step} delay={i * 150}>
                  <div className="relative">
                    <div className="font-display text-6xl font-bold text-white/[0.03] mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[#e8e4dd] mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#8b8d91]">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonial ──────────────────── */}
        <section className="py-32 border-t border-white/[0.04]">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="relative glass-card p-12 sm:p-16 text-center max-w-4xl mx-auto overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a45c]/30 to-transparent" />
                <p className="font-display text-2xl sm:text-3xl text-[#e8e4dd] leading-relaxed italic">
                  &ldquo;La justicia no es solo un ideal, es un sistema que
                  funciona mejor con las herramientas adecuadas.&rdquo;
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-px w-8 bg-[#c8a45c]/40" />
                  <p className="text-sm text-[#8b8d91]">
                    Justicia Verdadera — Tecnología al servicio del derecho
                  </p>
                  <div className="h-px w-8 bg-[#c8a45c]/40" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────── */}
        <section className="relative py-32 border-t border-white/[0.04] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#c8a45c]/3 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#c8a45c]/5 blur-[120px] pointer-events-none" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <ScrollReveal>
              <h2 className="font-display text-4xl font-bold text-[#e8e4dd] sm:text-5xl lg:text-6xl">
                El futuro de tu despacho
                <br />
                <span className="gradient-gold">empieza hoy</span>
              </h2>
              <p className="mt-6 text-lg text-[#8b8d91] max-w-xl mx-auto">
                Únete a los despachos que ya están transformando su práctica
                legal con inteligencia artificial.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    className="h-14 px-10 text-base bg-[#c8a45c] text-[#080b12] hover:bg-[#d4b36a] font-semibold shadow-xl shadow-[#c8a45c]/10 transition-all duration-300 hover:shadow-2xl hover:shadow-[#c8a45c]/20 hover:-translate-y-0.5"
                  >
                    Probar gratis 14 días
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-10 text-base border-white/[0.08] text-[#e8e4dd] hover:bg-white/[0.03]"
                  >
                    Hablar con ventas
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-[#8b8d91]/60">
                Sin compromiso. Sin tarjeta de crédito.
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.04] bg-[#060910]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c8a45c]/20 bg-[#c8a45c]/10">
                  <span className="font-display text-sm font-bold text-[#c8a45c]">
                    JV
                  </span>
                </div>
                <span className="font-display text-base font-semibold text-[#e8e4dd]">
                  Justicia Verdadera
                </span>
              </div>
              <p className="text-sm text-[#8b8d91] leading-relaxed">
                SaaS de gestión legal con inteligencia artificial para despachos
                de abogados en Honduras.
              </p>
            </div>
            {[
              {
                title: "Producto",
                links: ["Funcionalidades", "Precios", "Blog", "Documentación"],
              },
              {
                title: "Empresa",
                links: ["Sobre nosotros", "Contacto", "Prensa", "Partners"],
              },
              {
                title: "Legal",
                links: [
                  "Términos de servicio",
                  "Política de privacidad",
                  "Cookies",
                  "Compliance",
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-[#e8e4dd] mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-[#8b8d91] hover:text-[#e8e4dd] transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#8b8d91]/60">
              &copy; {new Date().getFullYear()} Justicia Verdadera. Todos los
              derechos reservados.
            </p>
            <p className="text-xs text-[#8b8d91]/60">
              Hecho con precisión en Honduras
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
