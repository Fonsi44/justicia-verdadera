"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Briefcase,
  ScanText,
  Receipt,
  Brain,
  Check,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
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
    icon: Briefcase,
    title: "Gestión de Expedientes",
    description:
      "Control total de casos con línea de tiempo, estados personalizables y alertas inteligentes de plazos procesales.",
  },
  {
    icon: ScanText,
    title: "OCR Automático",
    description:
      "Escanea y extrae texto de documentos e imágenes automáticamente. Búsqueda full-text en todos tus archivos legales.",
  },
  {
    icon: Receipt,
    title: "Facturación SAR",
    description:
      "Facturas electrónicas compliant con SAR Honduras. Cálculo automático de ISV 15%, retenciones y reportes fiscales.",
  },
  {
    icon: Brain,
    title: "IA Jurídica",
    description:
      "Asistente legal con DeepSeek V4. Redacta escritos, analiza jurisprudencia y sugiere estrategias basadas en tu corpus de documentos.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "750",
    period: "/mes",
    desc: "Para abogados independientes",
    features: [
      "1 usuario",
      "20 casos activos",
      "10 prompts IA/mes",
      "OCR básico",
      "Soporte por email",
    ],
  },
  {
    name: "Profesional",
    price: "2,050",
    period: "/mes",
    desc: "Para despachos en crecimiento",
    popular: true,
    features: [
      "3 usuarios",
      "100 casos activos",
      "50 prompts IA/mes",
      "OCR avanzado",
      "Facturación SAR completa",
      "Soporte prioritario",
    ],
  },
  {
    name: "Despacho",
    price: "5,150",
    period: "/mes",
    desc: "Para despachos consolidados",
    features: [
      "10 usuarios",
      "500 casos activos",
      "200 prompts IA/mes",
      "OCR ilimitado",
      "Facturación SAR + retenciones",
      "Soporte dedicado 24/7",
      "API y personalización",
    ],
  },
];

const footerLinks = [
  {
    title: "Producto",
    links: [
      { label: "Funcionalidades", href: "#funcionalidades" },
      { label: "Precios", href: "#precios" },
      { label: "Documentación", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "#" },
      { label: "Contacto", href: "#contacto" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos de servicio", href: "#" },
      { label: "Política de privacidad", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
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
            {["Funcionalidades", "Precios"].map((item) => (
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
            <Button
              render={<Link href="/auth/signin" />}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              nativeButton={false}
            >
              Acceder
            </Button>
            <Button
              render={<Link href="/auth/signin" />}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md shadow-primary/10"
              nativeButton={false}
            >
              Prueba gratuita
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* ─── Hero ──────────────────────────── */}
        <section className="relative overflow-hidden pt-28 pb-32">
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
              Justicia
              <br />
              <span className="gradient-primary">Verdadera</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-in-up stagger-1">
              Gestión legal inteligente para despachos hondureños. Expedientes,
              documentos, facturación SAR e IA jurídica en una sola plataforma.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-2">
              <Button
                render={<Link href="/auth/signin" />}
                size="lg"
                className="h-14 px-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5"
                nativeButton={false}
              >
                Comenzar prueba gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                render={<Link href="#funcionalidades" />}
                size="lg"
                variant="outline"
                className="h-14 px-10 text-base border-border text-foreground hover:bg-muted"
                nativeButton={false}
              >
                Explorar funcionalidades
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground/60 animate-fade-in stagger-3">
              Sin tarjeta de crédito. Cancela cuando quieras.
            </p>

            <div className="mt-16 animate-fade-in-up stagger-4">
              <ChevronDown className="mx-auto h-6 w-6 text-muted-foreground/30 animate-float" />
            </div>
          </div>
        </section>

        {/* ─── Features ──────────────────────── */}
        <section id="funcionalidades" className="py-28 border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <p className="text-sm font-medium tracking-widest text-accent uppercase mb-4">
                  Funcionalidades
                </p>
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  Todo lo que tu despacho necesita
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Herramientas diseñadas para abogados hondureños, con
                  tecnología de vanguardia.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <ScrollReveal key={feature.title} delay={i * 100}>
                  <div className="glass-card glass-card-hover p-8 h-full flex flex-col items-start">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                      {feature.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Stats ─────────────────────────── */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "100%", label: "Adaptado a Honduras" },
                { value: "14 días", label: "Prueba gratuita" },
                { value: "24/7", label: "Disponibilidad cloud" },
                { value: "0", label: "Sin tarjeta" },
              ].map((stat, i) => (
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

        {/* ─── Plans ─────────────────────────── */}
        <section id="precios" className="py-28">
          <div className="mx-auto max-w-7xl px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <p className="text-sm font-medium tracking-widest text-accent uppercase mb-4">
                  Precios
                </p>
                <h2 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                  Planes para cada despacho
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Todos incluyen 14 días de prueba gratuita. Sin tarjeta de
                  crédito. Sin permanencia.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  Precios en Lempiras (HNL)
                </div>
              </div>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {plans.map((plan, i) => (
                <ScrollReveal key={plan.name} delay={i * 150}>
                  <div
                    className={`relative glass-card flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      plan.popular
                        ? "ring-2 ring-primary/20 shadow-md shadow-primary/5"
                        : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-1 rounded-full">
                        Más popular
                      </div>
                    )}
                    <div className="p-8">
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
                          L {plan.price}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {plan.period}
                        </span>
                      </div>
                      <ul className="space-y-3 flex-1">
                        {plan.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <Check className="h-4 w-4 text-accent flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="px-8 pb-8 mt-auto">
                      <Button
                        render={<Link href="/auth/signin" />}
                        className={`w-full ${
                          plan.popular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-card text-foreground border border-border hover:bg-muted"
                        }`}
                        nativeButton={false}
                      >
                        Comenzar prueba
                      </Button>
                    </div>
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

        {/* ─── CTA Final ─────────────────────── */}
        <section className="relative py-28 border-t border-border overflow-hidden">
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
                legal con tecnología.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  render={<Link href="/auth/signin" />}
                  size="lg"
                  className="h-14 px-10 text-base bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5"
                  nativeButton={false}
                >
                  Comenzar prueba gratis
                </Button>
                <Button
                  render={<Link href="/auth/signin" />}
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-base border-border text-foreground hover:bg-muted"
                  nativeButton={false}
                >
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

      {/* ─── Footer ─────────────────────────── */}
      <footer id="contacto" className="border-t border-border bg-card">
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
              <div className="mt-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Email:</span>{" "}
                  contacto@justiciaverdadera.com
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Tel:</span> +
                  504 2XXX-XXXX
                </p>
              </div>
            </div>
            {footerLinks.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-foreground mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
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
