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
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10 transition-colors group-hover:bg-primary/20">
              <span className="font-display text-sm font-bold text-primary">
                JV
              </span>
            </div>
            <span className="font-display text-base font-semibold text-foreground tracking-wide hidden sm:block">
              Justicia Verdadera
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {["Funcionalidades", "Precios", "Blog"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button render={<Link href="/auth/signin" />} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" nativeButton={false}>
              Acceder
            </Button>
            <Button render={<Link href="/auth/signin" />} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md shadow-primary/10" nativeButton={false}>
              Prueba gratuita
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ─── Hero ──────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-28">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-40" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Lanzamiento en Honduras — Acceso anticipado
            </div>

            <h1 className="mx-auto max-w-5xl font-display text-5xl font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-[1.05] animate-fade-in-up">
              El despacho legal
              <br />
              <span className="gradient-primary">impulsado por IA</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-in-up stagger-1">
              La primera plataforma integral diseñada específicamente para
              abogados hondureños. Gestión de casos, automatización documental,
              facturación e inteligencia artificial jurídica en una sola
              herramienta.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-2">
              <Button render={<Link href="/auth/signin" />} size="lg" className="h-14 px-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5" nativeButton={false}>
                Comenzar prueba gratuita de 14 días
              </Button>
              <Button render={<Link href="#funcionalidades" />} size="lg" variant="outline" className="h-14 px-10 text-base border-border text-foreground hover:bg-muted" nativeButton={false}>
                Explorar funcionalidades
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground/60 animate-fade-in stagger-3">
              Sin tarjeta de crédito. Cancela cuando quieras.
            </p>
          </div>
        </section>

        {/* ─── Stats Bar ─────────────────────── */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 100}>
                  <div className="text-center">
                    <div className="font-display text-3xl font-bold text-primary sm:text-4xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
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
                <p className="text-sm font-medium tracking-widest text-accent uppercase mb-4">
                  Funcionalidades
                </p>
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  Todo lo que tu despacho{" "}
                  <span className="gradient-primary">necesita</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Una plataforma integral que reemplaza todas tus herramientas
                  actuales. Diseñada para abogados hondureños, construida con
                  tecnología de vanguardia.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <ScrollReveal key={feature.title} delay={i * 100}>
                  <div className="bg-card border border-border rounded-xl p-8 h-full group hover:shadow-lg hover:shadow-primary/[0.04] transition-all duration-300 hover:-translate-y-1">
                    <div className="mb-6 w-14 h-14 flex items-center justify-center">
                      <feature.icon className="w-12 h-12" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                    <div className="mt-6 h-px w-8 bg-accent/30 transition-all duration-500 group-hover:w-16 group-hover:bg-accent/60" />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────── */}
        <section className="py-32 border-t border-border bg-muted/20">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-20">
                <p className="text-sm font-medium tracking-widest text-accent uppercase mb-4">
                  Cómo funciona
                </p>
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  De Excel a{" "}
                  <span className="gradient-primary">inteligencia artificial</span>{" "}
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
                    <div className="font-display text-6xl font-bold text-primary/[0.06] mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonial ──────────────────── */}
        <section className="py-32 border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="relative bg-card border border-border rounded-2xl p-12 sm:p-16 text-center max-w-4xl mx-auto overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                <p className="font-display text-2xl sm:text-3xl text-foreground leading-relaxed italic">
                  &ldquo;La justicia no es solo un ideal, es un sistema que
                  funciona mejor con las herramientas adecuadas.&rdquo;
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-px w-8 bg-accent/40" />
                  <p className="text-sm text-muted-foreground">
                    Justicia Verdadera — Tecnología al servicio del derecho
                  </p>
                  <div className="h-px w-8 bg-accent/40" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── Pricing ──────────────────────── */}
        <section id="precios" className="py-32 border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-20">
                <p className="text-sm font-medium tracking-widest text-accent uppercase mb-4">
                  Precios
                </p>
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  Planes para cada
                  <span className="gradient-primary"> despacho</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Todos los planes incluyen periodo de prueba de 14 días. Sin
                  tarjeta de crédito. Sin permanencia.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Precios en Lempiras (HNL) — Beta privada
                </div>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "750",
                  period: " L/mes",
                  desc: "Para abogados independientes",
                  features: [
                    "1 usuario",
                    "20 casos activos",
                    "10 prompts IA al mes",
                    "Documentos ilimitados",
                    "Soporte por email",
                  ],
                  accent: false,
                },
                {
                  name: "Profesional",
                  price: "2,050",
                  period: " L/mes",
                  desc: "Para despachos en crecimiento",
                  features: [
                    "3 usuarios",
                    "100 casos activos",
                    "50 prompts IA al mes",
                    "Documentos ilimitados",
                    "OCR básico incluido",
                    "Soporte prioritario",
                  ],
                  accent: true,
                },
                {
                  name: "Despacho",
                  price: "5,150",
                  period: " L/mes",
                  desc: "Para despachos consolidados",
                  features: [
                    "10 usuarios",
                    "Casos ilimitados",
                    "200 prompts IA al mes",
                    "Documentos ilimitados",
                    "OCR avanzado",
                    "Soporte dedicado",
                    "Personalización",
                  ],
                  accent: false,
                },
              ].map((plan, i) => (
                <ScrollReveal key={plan.name} delay={i * 150}>
                  <div
                    className={`relative bg-card border rounded-2xl p-8 h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      plan.accent
                        ? "border-primary/30 shadow-md shadow-primary/5 ring-1 ring-primary/10"
                        : "border-border shadow-sm"
                    }`}
                  >
                    {plan.accent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-1 rounded-full">
                        Más popular
                      </div>
                    )}
                    <div>
                      <h3 className="font-display text-xl font-semibold text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.desc}
                      </p>
                    </div>
                    <div className="mt-6 mb-8">
                      <span className="font-display text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <svg
                            className="h-4 w-4 text-accent flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={300}>
              <p className="text-center mt-12 text-sm text-muted-foreground">
                ¿Necesitas algo más grande?{" "}
                <a
                  href="#contacto"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Plan Enterprise disponible
                </a>
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────── */}
        <section className="py-32 border-t border-border bg-muted/20">
          <div className="mx-auto max-w-3xl px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <p className="text-sm font-medium tracking-widest text-accent uppercase mb-4">
                  FAQ
                </p>
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  Preguntas{" "}
                  <span className="gradient-primary">frecuentes</span>
                </h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {[
                {
                  q: "¿Está adaptado al marco legal hondureño?",
                  a: "Sí. Justicia Verdadera está diseñada específicamente para abogados en Honduras. Los flujos de trabajo, la facturación SAR-compliant, los plazos procesales y la terminología legal están adaptados al sistema jurídico hondureño.",
                },
                {
                  q: "¿Necesito tarjeta de crédito para empezar?",
                  a: "No. El periodo de prueba de 14 días es completamente gratuito y no requiere tarjeta de crédito. Podrás explorar todas las funcionalidades sin compromiso.",
                },
                {
                  q: "¿Cómo protegen mis datos y los de mis clientes?",
                  a: "La seguridad es nuestra prioridad. Todos los datos están cifrados en tránsito y en reposo. Cada despacho está completamente aislado (multi-tenant). No compartimos, vendemos ni usamos tus datos para entrenar modelos de IA. Cumplimos con los más altos estándares de protección de datos.",
                },
                {
                  q: "¿La IA puede cometer errores legales?",
                  a: "La IA es una herramienta de asistencia, no un sustituto del abogado. Toda salida de IA debe ser revisada por un profesional colegiado. Nuestro sistema incluye verificación automática, puntuación de confianza y siempre muestra las fuentes utilizadas.",
                },
                {
                  q: "¿Puedo migrar mis datos desde Excel u otro sistema?",
                  a: "Sí. Ofrecemos importación de datos desde Excel y CSV. También podemos ayudarte con migraciones personalizadas desde otros sistemas de gestión legal. Contáctanos para más detalles.",
                },
                {
                  q: "¿Qué tipo de documentos puedo subir?",
                  a: "Aceptamos PDF, Word, imágenes (JPG, PNG, TIFF) y otros formatos comunes. El sistema incluye OCR para extraer texto de documentos escaneados e imágenes, facilitando la búsqueda dentro de tus archivos.",
                },
              ].map((faq, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <details className="group bg-card border border-border rounded-xl overflow-hidden transition-all duration-300">
                    <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer select-none">
                      <span className="font-display text-base font-semibold text-foreground group-open:text-primary transition-colors">
                        {faq.q}
                      </span>
                      <svg
                        className="h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="px-6 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </details>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ──────────────────────────── */}
        <section className="relative py-32 border-t border-border overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <ScrollReveal>
              <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
                El futuro de tu despacho
                <br />
                <span className="gradient-primary">empieza hoy</span>
              </h2>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
                Únete a los despachos que ya están transformando su práctica
                legal con inteligencia artificial.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button render={<Link href="/auth/signin" />} size="lg" className="h-14 px-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5" nativeButton={false}>
                  Probar gratis 14 días
                </Button>
                <Button render={<Link href="/auth/signin" />} size="lg" variant="outline" className="h-14 px-10 text-base border-border text-foreground hover:bg-muted" nativeButton={false}>
                  Hablar con ventas
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground/60">
                Sin compromiso. Sin tarjeta de crédito.
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────── */}
      <footer className="relative z-10 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-primary/10">
                  <span className="font-display text-sm font-bold text-primary">
                    JV
                  </span>
                </div>
                <span className="font-display text-base font-semibold text-foreground">
                  Justicia Verdadera
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
                <h4 className="text-sm font-semibold text-foreground mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} Justicia Verdadera. Todos los
              derechos reservados.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Hecho con precisión en Honduras
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
