# Plan de Ejecución — Justicia Verdadera

> **SaaS de gestión integral con automatizaciones e IA para despachos de abogados en Honduras.**
>
> **Modo de construcción**: proyecto solopreneur construido íntegramente por el fundador (Alfons Roiget) con Kilo Code como pair programmer de IA. Sin equipo externo, sin abogados asesores. La IA actúa como copiloto técnico, analista de producto, code reviewer y acelerador de desarrollo.
>
> **Objetivo de este documento**: servir como fuente de verdad única y plan de ejecución que Kilo Code lee y sigue para construir el SaaS paso a paso. Kilo Code es el pair programmer de IA que genera, revisa, despliega y documenta todo el código del proyecto.

---

## Metodología de Trabajo — Solopreneur + Kilo Code

### El modelo

```
Fundador (Alfons)                  Kilo Code (IA)
     │                                    │
     │── decisiones estratégicas ────────→│
     │── dirección de producto ──────────→│
     │── revisión y validación ←─────────│
     │                                    │
     │                                    │── escribe código
     │                                    │── diseña arquitectura
     │                                    │── crea tests
     │                                    │── documenta decisiones
     │                                    │── propone alternativas
     │                                    │── detecta bugs
     │                                    │── despliega a staging
     │                                    │
     ↓                                    ↓
        Producto construido sin equipo humano adicional
```

### Principios de colaboración

1. **Una decisión, un commit**: cada cambio atómico, trazable y reversible.
2. **La IA propone, el fundador dispone**: Kilo genera código, el fundador revisa, valida y aprueba.
3. **Primero funciona, luego escala**: MVP pragmático, sin sobre-ingeniería.
4. **Sin dependencias externas humanas**: sin necesidad de abogados, diseñadores, ni DevOps externos. Todo lo hace la IA + fundador.
5. **Velocidad > perfección**: ship features rápido, itera con feedback real.
6. **El conocimiento legal lo aporta la IA**: modelos LLM entrenados con jurisprudencia, doctrina y legislación hondureña obtenida vía web scraping + RAG.

### Stack de herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| **Kilo Code** | Pair programming, arquitectura, code review, despliegue |
| **GitHub** | Control de versiones, issues, proyectos |
| **Vercel** | Hosting serverless + preview deployments por rama |
| **Neon DB** | PostgreSQL serverless, branches para desarrollo |
| **Stripe** | Gestión de suscripciones y pagos |
| **Upstash Redis** | Cache, sesiones, rate limiting |
| **Resend** | Emails transaccionales |
| **DeepSeek** | IA jurídica (chat, RAG, embeddings) |

---

## 1. Resumen Ejecutivo

**Justicia Verdadera** es una plataforma SaaS cloud-native diseñada para digitalizar, automatizar y potenciar con inteligencia artificial la operativa diaria de los despachos de abogados en Honduras. Cubre la gestión integral del ciclo de vida de un caso legal.

**Estado actual**: Fase 1 completada. MVP funcional con 6 módulos, API REST 14 endpoints, auth auto-provisioning, dashboard con datos reales. Repo en GitHub — `master` limpio.

### Datos clave del proyecto

| Aspecto | Detalle |
|---|---|
| **Mercado objetivo** | Honduras (expansión futura a Centroamérica) |
| **Cliente inicial** | Despachos de 1 a 20 abogados |
| **Modelo de negocio** | SaaS B2B por suscripción mensual/anual |
| **Stack tecnológico** | Next.js 16 + TypeScript 5 + PostgreSQL + DeepSeek V4 Flash |
| **UI** | TailwindCSS 4 + shadcn/ui v4 (style: base-nova) |
| **Auth** | NextAuth.js v5 (beta) — JWT strategy |
| **DB ORM** | Drizzle ORM v0.45 + Neon DB serverless |
| **IA** | Vercel AI SDK v6 + @ai-sdk/deepseek |
| **Modo de construcción** | Solopreneur + Kilo Code (IA pair programmer) |
| **Repo GitHub** | `https://github.com/Fonsi44/justicia-verdadera` (privado) |
| **Rama** | `master` — única rama raíz |
| **Estado actual** | Fase 1 completada — build verde, API funcional, 6 módulos con páginas interactivas |
| **Última auditoría** | 30 mayo 2026 — estructura limpia, sin duplicados, .git en raíz workspace |

---

## 2. Visión y Misión

### Visión
Ser la plataforma tecnológica de referencia para la transformación digital del sector legal en Centroamérica, haciendo la justicia más accesible, eficiente y transparente.

### Misión
Proveer a los despachos de abogados hondureños de herramientas tecnológicas de clase mundial que automaticen tareas repetitivas, reduzcan errores, mejoren la colaboración y permitan a los abogados concentrarse en lo que realmente importa: sus clientes y sus casos.

---

## 3. Análisis de Mercado — Honduras

### 3.1 Sistema Judicial Hondureño

- **Poder Judicial de Honduras**: Corte Suprema de Justicia, 20+ juzgados de letras, juzgados de paz, tribunales de sentencia.
- **Materias**: Civil, Penal, Laboral, Familia, Contencioso-Administrativo, Mercantil.
- **Digitalización**: El Poder Judicial ha avanzado en expediente electrónico pero la adopción en despachos privados es baja.
- **Oportunidad**: La brecha tecnológica entre el sistema público y los despachos privados es enorme.

### 3.2 Tamaño del Mercado

| Segmento | Estimación |
|---|---|
| Abogados colegiados en Honduras | ~25,000+ (aprox.) |
| Despachos activos | ~3,000 - 5,000 |
| Despachos con >5 abogados | ~500 - 800 |
| TAM (mercado total) | ~$6M - $10M ARR potencial |
| SAM (mercado alcanzable inicial) | ~$500K - $1.5M ARR (Tegucigalpa + San Pedro Sula) |
| SOM (mercado obtenible año 1) | ~$60K - $120K ARR (50-100 despachos) |

### 3.3 Competencia

| Competidor | Origen | Fortalezas | Debilidades |
|---|---|---|---|
| **LegalSoft** (genérico) | Internacional | ERP robusto | No adaptado a Honduras, caro |
| **Clio** | USA/Canadá | Líder global | No español, no derecho civil |
| **Lefebvre / Aranzadi** | España | Doctrina y formularios | No gestión de despacho |
| **Soluciones locales (Excel, papel)** | Honduras | Coste cero | Ineficiencia total |
| **Software a medida local** | Honduras | Adaptado | Caro, no escalable |

**Ventaja competitiva**: No existe un SaaS moderno, asequible y adaptado al sistema judicial hondureño con IA integrada.

### 3.4 Entorno Regulatorio

- **Colegio de Abogados de Honduras (CAH)**: Regula el ejercicio profesional.
- **Ley de Protección de Datos Personales**: Proyecto en desarrollo, anticipar cumplimiento (GDPR-like).
- **Normativa de firma electrónica**: Vigente, oportunidad para integración.

---

## 4. Propuesta de Valor

> "El despacho de abogados del futuro, hoy. Automatiza lo administrativo, potencia lo jurídico."

### Diferenciadores clave

1. **Hecho para Honduras**: Adaptado al sistema judicial, terminología y práctica legal hondureña.
2. **IA jurídica integrada**: Redacción de escritos, análisis de jurisprudencia, predicción de resultados, chat con expedientes.
3. **Todo en uno**: Un solo sistema para gestión de casos, documentos, facturación, agenda y clientes.
4. **Precio accesible**: Modelo SaaS escalonado desde $29/mes.
5. **Cloud + On-premise híbrido**: Opcional para despachos con conectividad limitada.

---

## 5. Funcionalidades del Producto (MVP → Full)

### 5.1 Módulos Core (Fase 1 — MVP)

#### a) Gestión de Expedientes
- Creación y seguimiento de casos por materia (civil, penal, laboral, etc.)
- Línea de tiempo cronológica del expediente
- Vinculación de documentos, partes, abogados asignados
- Estados configurables del caso
- Número de expediente judicial + referencias internas
- Alertas de plazos y prescripciones

#### b) Gestión de Clientes y Contactos
- CRM de clientes con historial completo
- Gestión de partes contrarias, testigos, peritos
- Portal del cliente (fase 3): consulta de estado del caso, documentos, comunicación
- Consentimientos informados digitales

#### c) Gestión Documental
- Repositorio centralizado de documentos
- Plantillas de documentos legales (demandas, contestaciones, recursos, etc.)
- Rellenado automático de plantillas con datos del caso
- Control de versiones
- Firma electrónica integrada (fase 2)
- OCR para documentos escaneados (fase 2)

#### d) Agenda y Calendario
- Calendario de vistas, audiencias, plazos
- Sincronización con Google Calendar / Outlook
- Recordatorios automáticos (email, WhatsApp, push)
- Gestión de disponibilidad de abogados y salas

#### e) Facturación y Cobros
- Honorarios por caso (fijo, por hora, cuota litis)
- Generación de facturas (SAR compliant para Honduras)
- Control de pagos y cuentas por cobrar
- Recordatorios de pago automatizados
- Gastos del caso (tasas judiciales, peritos, desplazamientos)

### 5.2 Funcionalidades con IA (Fase 2)

#### a) Asistente Jurídico IA
- Chat con el expediente: preguntar en lenguaje natural sobre cualquier caso
- Redacción automática de borradores de escritos judiciales
- Análisis de jurisprudencia relevante para el caso
- Resumen automático de documentos y expedientes
- Traducción jurídica EN↔ES

#### b) Predicción y Análisis
- Análisis de probabilidad de éxito según histórico y jurisprudencia
- Estimación de plazos y duración de fases judiciales
- Detección de patrones de riesgo en casos
- Dashboard de KPIs del despacho

#### c) Automatizaciones Inteligentes
- Clasificación automática de documentos entrantes
- Extracción de datos de sentencias y resoluciones
- Detección de plazos y generación de alertas
- Workflows automatizados (ej: al recibir una demanda → crear caso, notificar, asignar tareas)

### 5.3 Funcionalidades Avanzadas (Fase 3)

- Portal del cliente con acceso a expedientes y comunicación cifrada
- Integración con el Poder Judicial de Honduras (Sistema de Expediente Electrónico cuando esté disponible API)
- App móvil PWA con acceso offline
- Marketplace de integraciones (contabilidad, RRHH, compliance)
- Módulo de cumplimiento normativo y prevención de blanqueo
- Multi-idioma (ES/EN)
- White-label para colegios de abogados

---

## 6. Plan de Automatizaciones

### Workflows automatizados prioritarios

| Automatización | Descripción | Trigger | Valor |
|---|---|---|---|
| **Onboarding de cliente** | Formulario digital → creación de ficha → contrato de honorarios → carpeta documental | Nuevo cliente registrado | Reduce 80% del tiempo administrativo inicial |
| **Notificaciones de plazos** | El sistema lee el expediente, detecta fechas clave y genera alertas multi-canal | Cron diario / event-driven | Evita pérdida de plazos procesales |
| **Generación de escritos** | Con los datos del caso + plantilla + IA, genera borrador del escrito en segundos | Solicitud del abogado | Reduce horas de redacción a minutos |
| **Conciliación de pagos** | Cruce automático de pagos con facturas pendientes | Webhook de Stripe | Elimina gestión manual de cobros |
| **Reportes al cierre** | Informes mensuales automáticos de actividad, horas facturables, casos activos, ingresos | Cron mensual | Visibilidad total del negocio |
| **Onboarding de nuevo abogado** | Asignación de roles, acceso a casos activos, training automatizado en la plataforma | Nuevo usuario creado | Integración inmediata al equipo |

### Motores de automatización

- **Inngest**: workflows event-driven, durable functions, retries, scheduling.
- **React Email + Resend**: plantillas de email transaccionales y de marketing.
- **Twilio**: notificaciones WhatsApp/SMS.
- **Webhooks de Stripe**: cambios en suscripciones y pagos.

---

## 7. Modelo de Negocio

### 7.1 Plan de Precios (SaaS)

| Plan | Precio Mensual | Usuarios | Casos activos | IA incluida |
|---|---|---|---|---|
| **Starter** | $29/mes | 1 | 20 | Básica (10 prompts/mes) |
| **Profesional** | $79/mes | 3 | 100 | Estándar (50 prompts/mes) |
| **Despacho** | $199/mes | 10 | Ilimitados | Avanzada (200 prompts/mes) |
| **Enterprise** | $499/mes | Ilimitados | Ilimitados | Premium + personalización |

- **Descuento**: 20% por pago anual.
- **Freemium**: Prueba gratuita 14 días (plan Starter).
- **Add-ons**: Usuarios extra ($9/u/mes), IA extra ($19/100 prompts), almacenamiento adicional.

### 7.2 Ingresos adicionales

- Servicios de migración de datos ($500 - $2,000 por despacho)
- Formación online certificada ($99/curso)
- Marketplace de plantillas legales premium (comisión 30%)

### 7.3 Proyección Financiera (Escenario Conservador)

| Año | Clientes | ARR | Costes infraestructura | Resultado |
|---|---|---|---|---|
| Año 1 | 40 | $48,000 | ~$3,600/año (Vercel Pro + Neon + APIs) | -$3,600 |
| Año 2 | 150 | $190,000 | ~$12,000/año | +$178,000 |
| Año 3 | 400 | $550,000 | ~$30,000/año | +$520,000 |
| Año 5 | 1,200+ | $1.8M+ | ~$80,000/año | +$1.7M+ |

---

## 8. Stack Tecnológico

### 8.1 Estructura del Proyecto

```
justicia-verdadera/              ← workspace (Kilo Code + git root)
├── .gitignore                   ← ignora node_modules, .env*, .next, *.png
├── master.md                    ← plan de ejecución (este documento)
├── AGENTS.md                    ← instrucciones para Kilo Code
├── apis.md                      ← guía de obtención de API keys
├── .kilo/                       ← configuración de Kilo Code
└── app/                         ← proyecto Next.js 16
    ├── app/                     ← App Router
    │   ├── (dashboard)/         ← rutas autenticadas
    │   │   ├── layout.tsx       ← sidebar + header
    │   │   ├── dashboard/
    │   │   ├── casos/           ← CRUD expedientes (page, [id], nuevo)
    │   │   ├── clientes/        ← CRUD contactos (page, [id], nuevo)
    │   │   ├── documentos/      ← gestión documental
    │   │   ├── agenda/          ← calendario eventos
    │   │   └── facturacion/     ← facturación
    │   ├── auth/signin/         ← página de login
    │   ├── auth/error/          ← página de error auth
    │   ├── api/                 ← 14 endpoints REST
    │   │   ├── auth/[...nextauth]/
    │   │   ├── cases/ + [id]/
    │   │   ├── contacts/ + [id]/
    │   │   ├── documents/ + [id]/
    │   │   ├── events/ + [id]/
    │   │   ├── invoices/ + [id]/
    │   │   ├── time-entries/
    │   │   └── dashboard/
    │   ├── layout.tsx           ← root layout (fuentes, providers)
    │   ├── page.tsx             ← landing page
    │   ├── globals.css          ← Tailwind v4 + tema + animaciones
    │   ├── not-found.tsx        ← 404
    │   ├── error.tsx            ← 500
    │   └── loading.tsx          ← loading state
    ├── components/
    │   ├── ui/                  ← 25 componentes shadcn/ui v4
    │   ├── illustrations/       ← SVGs vectoriales
    │   ├── forms/               ← formularios (sign-in-form)
    │   ├── layout/              ← layouts reutilizables
    │   └── providers/           ← QueryProvider (React Query)
    ├── lib/
    │   ├── auth/                ← NextAuth config + require-auth
    │   ├── billing/             ← Stripe (lazy init)
    │   ├── db/                  ← Drizzle client (Neon)
    │   ├── inngest/             ← Inngest client
    │   └── utils.ts             ← cn(), formatCurrency(), formatDate()
    ├── hooks/                   ← 6 hooks React Query
    ├── stores/                  ← Zustand stores (pendiente)
    ├── types/                   ← TypeScript types compartidos
    ├── database/
    │   ├── schema.ts            ← 18 tablas Drizzle ORM
    │   └── seed.ts              ← datos demo
    ├── drizzle.config.ts        ← Drizzle Kit config
    ├── proxy.ts                 ← auth middleware (Next.js 16)
    ├── vercel.json              ← Vercel deploy config
    ├── .env.local               ← variables de entorno (no commitear)
    ├── .env.example             ← plantilla de variables
    └── package.json             ← 40+ dependencias
```

### 8.2 Versiones y Paquetes Clave

```json
{
  "dependencies": {
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "typescript": "^5",
    "next-auth": "^5.0.0-beta.31",
    "@auth/drizzle-adapter": "^1.11.2",
    "drizzle-orm": "^0.45.2",
    "drizzle-kit": "^0.31.10",
    "@neondatabase/serverless": "^1.1.0",
    "@tanstack/react-query": "^5.100.14",
    "@tanstack/react-table": "^8.21.3",
    "react-hook-form": "^7.76.1",
    "@hookform/resolvers": "^5.4.0",
    "zod": "^4.4.3",
    "tailwindcss": "^4",
    "shadcn": "^4.8.3",
    "lucide-react": "^1.17.0",
    "recharts": "^3.8.1",
    "date-fns": "^4.3.0",
    "ai": "^6.0.193",
    "@ai-sdk/deepseek": "^2.0.35",
    "stripe": "^22.2.0",
    "@stripe/stripe-js": "^9.7.0",
    "resend": "^6.12.4",
    "@react-email/components": "^1.0.12",
    "uploadthing": "^7.7.4",
    "@upstash/redis": "^1.38.0",
    "@upstash/ratelimit": "^2.0.8",
    "inngest": "^4.5.0",
    "zustand": "^5.0.14",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "next-themes": "^0.4.6",
    "react-day-picker": "^10.0.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.6.0",
    "tw-animate-css": "^1.4.0",
    "vaul": "^1.1.2",
    "@base-ui/react": "^1.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.19.41",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "prettier": "^3.8.3",
    "prettier-plugin-tailwindcss": "^0.8.0",
    "@tailwindcss/postcss": "^4"
  }
}
```

> **Nota**: `@sentry/nextjs` y `posthog-js` permanecen en `package.json` como dependencias muertas (sin configuración ni imports activos). Se eliminarán en próxima limpieza. `vitest`, `@playwright/test` y `turbo` no están instalados (testing aún no configurado).

### 8.3 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario final (Navegador / PWA)                             │
├─────────────────────────────────────────────────────────────┤
│  Vercel (Edge Network + Serverless Functions + ISR)          │
│  ├── next.config.ts (headers, redirects, image optimization) │
│  ├── proxy.ts (auth, protección de rutas)                    │
│  └── Serverless Functions (API routes, Inngest)              │
├─────────────────────────────────────────────────────────────┤
│  Neon DB (PostgreSQL serverless, branching, pooled)          │
│  Upstash Redis (cache, sessions, rate limits, queues)        │
├─────────────────────────────────────────────────────────────┤
│  Resend (emails transaccionales)                             │
│  Stripe (pagos y suscripciones)                              │
│  DeepSeek V4 Flash (IA jurídica, embeddings, RAG)            │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Principios Técnicos

- **TypeScript end-to-end**: type safety total, desde DB hasta frontend.
- **API REST**: endpoints tipados en `app/api/`, firm-isolation via `getFirmId()` en cada handler. Preparado para app móvil.
- **Multi-tenant por columna `firm_id`**: filtrado a nivel de aplicación con WHERE clauses. Datos aislados entre despachos.
- **Optimistic UI**: mutaciones instantáneas con React Query, invalidación de caché automática.
- **Edge-ready**: proxy, ISR, streaming SSR, parcialmente edge si es necesario.
- **Seguridad desde el día 1**: encriptación AES-256 en reposo, TLS 1.3 en tránsito, audit logs, RBAC granular.
- **Testing**: Vitest (unitarios + integración) + Playwright (E2E). 80% coverage en lógica crítica.

---

## 9. Base de Datos — Schema MVP

> Este es el schema relacional del MVP, implementado con PostgreSQL + Drizzle ORM. Solo las tablas esenciales para la Fase 1. Se expandirá en fases posteriores.

### Diagrama conceptual

```
firms (despacho)
  │
  ├── users (abogados, staff)
  │     ├── sessions (NextAuth)
  │     └── accounts (NextAuth providers)
  │
  ├── cases (expedientes)
  │     ├── case_parties (partes del caso)
  │     ├── case_events (eventos: vistas, audiencias, plazos)
  │     ├── documents (documentos vinculados vía caseId FK)
  │     └── time_entries (horas facturables vía caseId FK)
  │
  ├── contacts (clientes, contrarias, testigos, peritos, jueces)
  │
  ├── documents (documentos con versiones)
  │     └── document_versions
  │
  ├── templates (plantillas de documentos legales)
  │
  ├── invoices (facturas)
  │     └── invoice_items (líneas de factura)
  │
  ├── payments (pagos registrados)
  │
  ├── notifications (registro de notificaciones enviadas)
  │
  └── audit_logs (registro de acciones para compliance)
```

### Definición de tablas (Drizzle ORM — TypeScript)

```typescript
// ─── FIRMS ─────────────────────────────────────
export const firms = pgTable("firms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  logo: text("logo"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  taxId: text("tax_id"), // RTN en Honduras
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ─── USERS ─────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  role: text("role", { enum: ["owner", "admin", "lawyer", "assistant", "staff"] })
    .default("lawyer").notNull(),
  barNumber: text("bar_number"), // número de colegiación
  specialty: text("specialty"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
},
(table) => [
  index("user_email_idx").on(table.email),
  index("user_firm_idx").on(table.firmId),
]);

// ─── CASES ─────────────────────────────────────
export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  number: text("number").notNull(), // número interno: "CV-2026-0042"
  courtNumber: text("court_number"), // número del juzgado
  title: text("title").notNull(),
  description: text("description"),
  matter: text("matter", {
    enum: ["civil", "penal", "laboral", "familia", "mercantil", "contencioso", "constitucional"]
  }).notNull(),
  status: text("status", {
    enum: ["activo", "archivado", "cerrado", "suspendido"]
  }).default("activo").notNull(),
  priority: text("priority", {
    enum: ["baja", "media", "alta", "urgente"]
  }).default("media").notNull(),
  assignedLawyerId: uuid("assigned_lawyer_id").references(() => users.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  estimatedValue: numeric("estimated_value"), // cuantía
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
},
(table) => [
  index("case_firm_status_matter_idx").on(table.firmId, table.status, table.matter),
  index("case_firm_lawyer_idx").on(table.firmId, table.assignedLawyerId),
  index("case_firm_number_idx").on(table.firmId, table.number),
]);

// ─── CASE PARTIES ──────────────────────────────
export const caseParties = pgTable("case_parties", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id).notNull(),
  role: text("role", {
    enum: ["cliente", "contraria", "testigo", "perito", "juez", "fiscal", "otro"]
  }).notNull(),
  isMain: boolean("is_main").default(false),
  notes: text("notes"),
});

// ─── CONTACTS ──────────────────────────────────
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  type: text("type", {
    enum: ["persona_natural", "persona_juridica", "institucion"]
  }).default("persona_natural").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyName: text("company_name"),
  identityNumber: text("identity_number"), // DNI / RTN
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
},
(table) => [
  index("contact_firm_idx").on(table.firmId),
  index("contact_firm_email_idx").on(table.firmId, table.email),
]);

// ─── CASE EVENTS (hitos del expediente) ────────
export const caseEvents = pgTable("case_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  type: text("type", {
    enum: ["vista", "audiencia", "plazo", "sentencia", "resolucion", "notificacion", "otro"]
  }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"), // sala, juzgado
  isCompleted: boolean("is_completed").default(false),
  notifiedAt: timestamp("notified_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── DOCUMENTS ─────────────────────────────────
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  caseId: uuid("case_id").references(() => cases.id),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["demanda", "contestacion", "recurso", "sentencia", "contrato", "poder", "prueba", "informe", "otro"]
  }).default("otro").notNull(),
  currentVersion: integer("current_version").default(1).notNull(),
  status: text("status", {
    enum: ["borrador", "final", "firmado", "archivado"]
  }).default("borrador").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
},
(table) => [
  index("document_firm_case_type_idx").on(table.firmId, table.caseId, table.type),
]);

// ─── DOCUMENT VERSIONS ─────────────────────────
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key").notNull(), // clave en S3/UploadThing
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  changes: text("changes"), // descripción de cambios
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── DOCUMENT TEMPLATES ────────────────────────
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["demanda", "contestacion", "recurso", "contrato", "poder", "carta", "otro"]
  }).notNull(),
  matter: text("matter"),
  content: text("content").notNull(), // contenido con placeholders {{ }}
  isPublic: boolean("is_public").default(false), // template global o del despacho
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ─── INVOICES ──────────────────────────────────
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  caseId: uuid("case_id").references(() => cases.id),
  clientId: uuid("client_id").references(() => contacts.id).notNull(),
  number: text("number").notNull(), // factura #F2026-0042
  status: text("status", {
    enum: ["borrador", "emitida", "pagada", "anulada", "vencida"]
  }).default("borrador").notNull(),
  subtotal: numeric("subtotal").notNull(),
  tax: numeric("tax").notNull(), // ISV 15% en Honduras
  total: numeric("total").notNull(),
  currency: text("currency").default("HNL").notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── INVOICE ITEMS ─────────────────────────────
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").default("1").notNull(),
  unitPrice: numeric("unit_price").notNull(),
  total: numeric("total").notNull(),
  timeEntryId: uuid("time_entry_id").references(() => timeEntries.id),
});

// ─── TIME ENTRIES ──────────────────────────────
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMinutes: integer("duration_minutes"),
  hourlyRate: numeric("hourly_rate"),
  isBillable: boolean("is_billable").default(true),
  isInvoiced: boolean("is_invoiced").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── PAYMENTS ──────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  amount: numeric("amount").notNull(),
  method: text("method", {
    enum: ["transferencia", "efectivo", "cheque", "tarjeta", "stripe", "otro"]
  }).notNull(),
  reference: text("reference"),
  notes: text("notes"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ─────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  caseId: uuid("case_id").references(() => cases.id),
  type: text("type", {
    enum: ["plazo", "vista", "audiencia", "factura", "documento", "sistema", "mensaje"]
  }).notNull(),
  title: text("title").notNull(),
  body: text("body"),
  channel: text("channel", {
    enum: ["email", "whatsapp", "sms", "push", "in_app"]
  }).notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── AUDIT LOGS ────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  firmId: uuid("firm_id").references(() => firms.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(), // "case.created", "document.deleted"
  entityType: text("entity_type").notNull(), // "case", "document", "invoice"
  entityId: uuid("entity_id"),
  changes: jsonb("changes"), // diff JSON: { antes, después }
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── NEXT AUTH TABLES ──────────────────────────
// accounts, sessions, verification_tokens (Drizzle adapter auto-genera)
```

### Índices críticos (definidos en el schema)

```typescript
// Búsquedas frecuentes:
firms           => index on (slug)
users           => index on (email), index on (firm_id)
cases           => index on (firm_id, status, matter)
cases           => index on (firm_id, assigned_lawyer_id)
cases           => index on (firm_id, number)
case_parties    => index on (case_id)
case_events     => index on (case_id, date)
contacts        => index on (firm_id), index on (firm_id, email)
documents       => index on (firm_id, case_id, type)
document_versions => uniqueIndex on (document_id, version)
time_entries    => index on (case_id, user_id)
invoices        => index on (firm_id, status, due_date)
payments        => index on (firm_id, invoice_id)
notifications   => index on (user_id, is_read, created_at)
accounts        => uniqueIndex on (provider, provider_account_id)
sessions        => index on (session_token)
verification_tokens => uniqueIndex on (identifier, token)
```

> **Nota**: Búsqueda full-text para casos y documentos e índices pgvector para embeddings semánticos IA se implementarán en Fase 2.

---

## 10. Estructura de API (REST)

### Endpoints implementados (Fase 1)

```
app/api/
├── cases/
│   ├── route.ts              GET (listar + filtros) | POST (crear)
│   └── [id]/route.ts         GET | PATCH | DELETE
├── contacts/
│   ├── route.ts              GET (listar + filtros) | POST (crear)
│   └── [id]/route.ts         GET | PATCH | DELETE
├── documents/
│   ├── route.ts              GET (listar + filtros) | POST (crear)
│   └── [id]/route.ts         GET | PATCH | DELETE
├── events/
│   ├── route.ts              GET (listar + filtros + paginación) | POST (crear)
│   └── [id]/route.ts         GET | PATCH (toggle completado) | DELETE
├── invoices/
│   ├── route.ts              GET (listar + filtros + paginación) | POST (crear con items)
│   └── [id]/route.ts         GET (con items) | PATCH (con máquina de estados) | DELETE
├── time-entries/
│   └── route.ts              GET (listar + filtros + paginación) | POST (crear)
├── dashboard/
│   └── route.ts              GET (stats agregados: casos activos, eventos próximos, facturación, horas)
└── auth/
    └── [...nextauth]/route.ts  NextAuth handlers (GET, POST)
```

### Convenciones de API

- **Autenticación**: JWT via NextAuth v5. Cada handler obtiene `firmId` mediante `getFirmId()` de `@/lib/auth/require-auth`.
- **Aislamiento multi-tenant**: todas las queries incluyen `eq(table.firmId, firmId)` en el WHERE.
- **Paginación**: parámetros `page` y `limit` con clamp (`Math.min(100, ...)`). Respuesta incluye `total`, `page`, `limit`, `totalPages`.
- **Filtros**: query params (`?search=`, `?status=`, `?matter=`, `?type=`, etc.) según el recurso.
- **Errores**: `NextResponse.json({ error: "mensaje" }, { status: 4xx/5xx })`.
- **Formato**: `Response.json({ data, total, page, limit, totalPages })` para listas, `{ data: entity }` para singles.

---

## 11. Estrategia de IA Jurídica

### Arquitectura RAG (Retrieval-Augmented Generation)

```
Consulta del abogado
        │
        ▼
┌──────────────────────┐
│   Embedding query    │ ← DeepSeek V4 Flash embeddings
└──────┬───────────────┘
        │
        ▼
┌──────────────────────┐
│  Búsqueda semántica  │ ← pgvector cosine similarity
│  en corpus legal HN  │    + filtros por materia, fecha
└──────┬───────────────┘
        │
        ▼
┌──────────────────────┐
│  Recuperación top-K  │ ← 5-10 fragmentos más relevantes
│  (leyes, sentencias, │    con score de relevancia
│   doctrina, propios  │
│   documentos firma)  │
└──────┬───────────────┘
        │
        ▼
┌──────────────────────┐
│  Prompt aumentado    │ ← system prompt jurídico
│  + contexto + query  │    + instrucciones específicas
└──────┬───────────────┘
        │
        ▼
┌──────────────────────┐
│  LLM (DeepSeek V4 Flash)│ ← streaming de respuesta
│  → Respuesta fundada │    con citas y referencias
└──────────────────────┘
```

### Construcción del corpus legal hondureño (sin abogados)

La IA (Kilo) construirá el corpus mediante web scraping automatizado:

1. **Legislación**: scraping de leyes, códigos y decretos de `tsc.gob.hn`, `poderjudicial.gob.hn`, `gaceta.hn`.
2. **Jurisprudencia**: scraping de sentencias públicas de la Corte Suprema de Justicia.
3. **Doctrina**: artículos y publicaciones de universidades y revistas jurídicas hondureñas.
4. **Procesamiento**: limpieza, chunking, embedding con DeepSeek V4 Flash, almacenamiento en `pgvector`.
5. **Actualización periódica**: cron mensual de re-indexación.

### Funcionalidades IA concretas a construir

| Funcionalidad | Prompt engineering | RAG | Tool calling |
|---|---|---|---|
| **Chat con expediente** | Sistema: "Eres un asistente jurídico hondureño..." | Documentos del caso + legislación relevante | Buscar docs, crear notas |
| **Redacción de escritos** | Sistema: "Eres un abogado redactor..." | Plantilla + datos del caso + jurisprudencia | Insertar datos del caso |
| **Resumen de documentos** | Sistema: "Resume este documento jurídico..." | Documento completo + mapa conceptual | Guardar resumen |
| **Predicción de plazos** | Sistema: "Analiza plazos procesales..." | Código Procesal Civil/Penal HN | Crear eventos |
| **Clasificación de docs** | Sistema: "Clasifica este documento..." | Catálogo de tipos documentales | Etiquetar documento |
| **Extracción de datos** | Sistema: "Extrae datos estructurados..." | Sentencias y resoluciones | Poblar campos del caso |

---

## 12. Roadmap de Ejecución (Solopreneur + IA)

### Fase 0 — Setup y Planificación ✅ COMPLETADA (29 mayo 2026)

**Resultado**: Proyecto Next.js 16 funcional, build verde, sin dependencias de APIs externas para arrancar.

- [x] Definir plan de empresa y ejecución (`master.md`)
- [x] Inicializar proyecto Next.js 16 + TypeScript + TailwindCSS 4
- [x] Drizzle ORM + schema base (18 tablas listas para migrar)
- [x] NextAuth.js v5 con JWT strategy (GitHub + Google)
- [x] shadcn/ui v4 (25 componentes instalados)
- [x] CI/CD (GitHub Actions → lint + typecheck + Vercel preview)
- [x] Landing page profesional (Playfair Display + DM Sans, glassmorphism, SVG illustrations, scroll reveals)
- [x] Dashboard layout + página principal con stats mock
- [x] Auth page (sign-in con GitHub + Google)
- [x] Error pages (404, 500, loading)
- [x] Stripe billing module (lazy init, no requiere key)
- [x] Inngest client (configurado, requiere key para usarse)
- [x] Proxy middleware (protege rutas del dashboard)
- [x] Vercel config (`vercel.json`)
- [x] `.env.local` con todas las variables configuradas
- [x] `apis.md` — guía detallada paso a paso para obtener cada API key (9 servicios)
- [x] **Verificación de servicios** — todos los APIs comprobados (ver tabla abajo)
- [x] Neon DB — proyecto creado, 18 tablas migradas vía `drizzle-kit push`

### Estado de servicios — verificación 2026-05-30

| Servicio | Estado | Detalle |
|---|---|---|
| **Neon DB** | ✅ | 18 tablas creadas vía `drizzle-kit push` |
| **DeepSeek V4 Flash** | ✅ | API responde, completions OK |
| **Upstash Redis** | ✅ | Ping REST exitoso |
| **Resend** | ✅ | Email de prueba enviado correctamente |
| **Stripe** | ✅ | Modo test activo, balance OK |
| **GitHub OAuth** | ⚠️ | Keys configuradas — requiere navegador para verificar |
| **Google OAuth** | ⚠️ | Keys configuradas — requiere navegador para verificar |
| **UploadThing** | ❌ | 401 Invalid API key — token inválido o expirado |

- [ ] Configurar dominio y DNS (requiere dominio)

**Comandos de setup (ejecutados por Kilo Code):**

```bash
# 1. Crear proyecto Next.js
npx create-next-app@latest justicia-verdadera --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 2. Instalar dependencias core
npm install drizzle-orm @neondatabase/serverless drizzle-kit
npm install next-auth@beta @auth/drizzle-adapter
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install date-fns lucide-react recharts zustand

# 3. Instalar AI
npm install ai @ai-sdk/deepseek

# 4. Instalar infraestructura
npm install stripe @stripe/stripe-js
npm install resend @react-email/components
npm install uploadthing @upstash/redis @upstash/ratelimit
npm install inngest
npm install @sentry/nextjs posthog-js

# 5. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label separator dropdown-menu avatar badge

# 6. Configurar variables de entorno
# Crear .env.local con todas las keys necesarias
```

### Fase 1 — MVP Core ✅ COMPLETADA (30 mayo 2026)

**Resultado**: MVP funcional con 6 módulos, API REST completa, 14 endpoints, autenticación con auto-provisioning, dashboard con datos reales.

- [x] **Auth + Multi-tenant**: Auto-provisioning de firma/usuario en primer sign-in OAuth (GitHub/Google). JWT con firmId y role. NextAuth v5 con callbacks de sincronización BD.
- [x] **Casos**: CRUD completo (API + páginas). Lista con filtros (materia, estado, búsqueda), formulario de creación con react-hook-form + zod, vista detalle con tabs (cronograma, partes, documentos, finanzas).
- [x] **Clientes/Contactos**: CRUD completo. Lista con búsqueda y filtro por tipo, formulario de creación con campos condicionales según tipo.
- [x] **Documentos**: CRUD de metadata. Lista con filtros y vinculación a casos.
- [x] **Agenda/Calendario**: CRUD de eventos. Lista con filtros por tipo y rango, toggle completado.
- [x] **Facturación**: CRUD de facturas con cálculo automático (subtotal + ISV 15%). Registro de tiempo facturable.
- [x] **Dashboard**: Panel con stats reales desde BD (casos activos, vistas próximas, facturación pendiente, horas facturables, casos recientes, plazos próximos).
- [x] **API REST**: 14 endpoints tipados (cases, contacts, documents, events, invoices, time-entries, dashboard).
- [x] **React Query**: Hooks para todos los módulos con invalidación de caché automática.
- [x] **TypeScript estricto**: 0 errores de typecheck.
- [x] **ESLint**: 0 errores de lint.

**Arquitectura de archivos (Phase 1)**:
```
app/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx    ← Stats reales desde BD
│   │   ├── casos/
│   │   │   ├── page.tsx          ← Lista con filtros
│   │   │   ├── _client.tsx       ← Cliente interactivo
│   │   │   ├── nuevo/page.tsx    ← Formulario creación
│   │   │   └── [id]/page.tsx     ← Vista detalle
│   │   ├── clientes/
│   │   │   ├── page.tsx          ← Lista contactos
│   │   │   ├── nuevo/page.tsx    ← Formulario creación
│   │   │   └── [id]/page.tsx     ← Vista detalle
│   │   ├── documentos/page.tsx   ← Lista documentos
│   │   ├── agenda/page.tsx       ← Calendario eventos
│   │   └── facturacion/page.tsx  ← Lista facturas
│   └── api/
│       ├── cases/route.ts + [id]/route.ts
│       ├── contacts/route.ts + [id]/route.ts
│       ├── documents/route.ts + [id]/route.ts
│       ├── events/route.ts + [id]/route.ts
│       ├── invoices/route.ts + [id]/route.ts
│       ├── time-entries/route.ts
│       └── dashboard/route.ts
├── hooks/
│   ├── use-cases.ts          ← React Query hooks
│   ├── use-contacts.ts
│   ├── use-documents.ts
│   ├── use-events.ts
│   ├── use-invoices.ts
│   └── use-dashboard.ts
├── types/index.ts            ← Tipos compartidos
└── lib/auth/
    ├── index.ts              ← NextAuth v5 + auto-provisioning
    └── require-auth.ts       ← Helpers getSession/getFirmId
```

### Fase 2 — IA y Automatizaciones (Sprints 9-14, ~2 meses)

**Sprint 9-10: Asistente IA — Chat con expedientes**
- UI de chat (inspirado en DeepSeek/Claude)
- RAG pipeline: embeddings, búsqueda pgvector
- Chat contextualizado con el expediente abierto
- Historial de conversaciones por caso
- Streaming de respuestas

**Sprint 11: Redacción IA de escritos**
- Selector de tipo de escrito (demanda, contestación, recurso...)
- Generación automática con datos del caso
- Editor de texto enriquecido (TipTap / BlockNote)
- Control de versiones del escrito generado
- Exportación a DOCX y PDF

**Sprint 12: Automatizaciones y Workflows**
- Workflows con Inngest (onboarding cliente, notificaciones plazos)
- Notificaciones por email y WhatsApp (Twilio)
- Recordatorios automáticos de plazos y vistas
- Webhooks de Stripe (cambio de plan, pago fallido, factura pagada)
- OCR básico de documentos subidos

**Sprint 13: Dashboard y Reportes**
- Dashboard principal (KPIs: casos activos, facturación, horas, plazos próximos)
- Gráficos (Recharts): casos por materia, estado, evolución mensual
- Exportación de reportes a PDF y Excel
- Widgets configurables por usuario

**Sprint 14: Polishing y lanzamiento beta**
- Onboarding in-app (tutorial guiado)
- Emails transaccionales (bienvenida, recordatorio, factura, etc.)
- Página de precios y checkout completo
- Prueba gratuita 14 días
- Documentación de usuario
- Landing de lanzamiento en Honduras

### Fase 3 — Escalado y Avanzado (Sprints 15-22, ~3 meses)

- Portal del cliente
- App PWA con offline support
- Firma electrónica
- OCR avanzado con IA
- Predicción de resultados
- Multi-idioma ES/EN
- Marketplace de plantillas
- Expansión Guatemala / El Salvador

### Fase 4 — Crecimiento (Sprints 23+)

- IA avanzada (predicción de riesgos, análisis de sentencias)
- API pública para integraciones
- Segmentación por especialidad
- Certificaciones de compliance
- Más países CA

---

## 13. Análisis DAFO

### Fortalezas
- Primer SaaS específico para el mercado legal hondureño
- IA integrada como diferenciador clave
- Stack tecnológico moderno, escalable y low-ops
- Velocidad de ejecución (solopreneur + IA, sin burocracia)
- Costes operativos mínimos (sin salarios, sin oficina)

### Debilidades
- Dependencia de APIs de IA de terceros (DeepSeek)
- Marca nueva, sin reputación en el sector
- Fundador sin background jurídico (compensado por IA + RAG)
- Mercado hondureño pequeño, necesidad de expansión regional
- Sin validación previa con abogados reales (se validará post-MVP)

### Oportunidades
- Digitalización incipiente del sector legal hondureño
- Sin competidor directo con IA integrada
- Expansión natural a Guatemala, El Salvador, Nicaragua
- Posible integración futura con expediente judicial electrónico
- Demanda creciente de eficiencia en despachos

### Amenazas
- Resistencia al cambio en abogados tradicionales
- Limitaciones de conectividad en zonas rurales
- Entrada de competidores internacionales (Clio, PracticePanther)
- Cambios regulatorios en IA y protección de datos
- Inestabilidad política/económica en Honduras
- Dependencia excesiva de un único proveedor de IA (DeepSeek — mitigar con modelo de respaldo si es necesario)

---

## 14. Go-to-Market (Post-MVP)

### Canales de adquisición

1. **SEO local**: "software para abogados Honduras", "gestión de despachos legales", "programa jurídico Honduras"
2. **LinkedIn Ads**: segmentado a abogados en Honduras
3. **Google Ads**: keywords locales de intención de compra
4. **Contenido**: blog jurídico-tecnológico, guías prácticas, webinars
5. **Directo**: cold email/DM a despachos en Tegucigalpa y San Pedro Sula
6. **Alianzas**: Colegio de Abogados de Honduras (post-validación)

### Métricas North Star

| Métrica | Objetivo |
|---|---|
| MRR | $4K+ al mes 6 |
| Churn Rate | <3% mensual |
| Tiempo hasta valor | <5 min del registro al primer caso |
| NPS | >50 |
| LTV/CAC | >3:1 |

---

## 15. Próximos Pasos Inmediatos (Fase 2)

1. **Limpieza de dependencias**
   - Eliminar `@sentry/nextjs` y `posthog-js` del `package.json` (dependencias muertas)
   - Instalar `vitest`, `@playwright/test` para testing
   - Crear `.env.example` actualizado

2. **Subida de archivos (UploadThing)**
   - Renovar token de UploadThing (actualmente inválido)
   - Implementar upload UI con drag & drop para documentos
   - Vincular archivos subidos a `document_versions`

3. **Asistente IA — Chat con expedientes** (Sprint 9-10)
   - UI de chat contextualizado por caso
   - RAG pipeline: embeddings con DeepSeek V4 Flash
   - Búsqueda semántica con pgvector
   - Streaming de respuestas

4. **Redacción IA de escritos** (Sprint 11)
   - Generación automática de borradores con datos del caso
   - Editor de texto enriquecido (TipTap/BlockNote)
   - Exportación a DOCX y PDF

5. **Automatizaciones y Workflows** (Sprint 12)
   - Workflows con Inngest (onboarding, notificaciones de plazos)
   - Notificaciones email con Resend + React Email
   - Webhooks de Stripe (cambio de plan, pago fallido)

6. **Dashboard avanzado y Reportes** (Sprint 13)
   - Gráficos con Recharts (casos por materia, estado, evolución)
   - Exportación de reportes a PDF y Excel

7. **Stripe Checkout y Pricing**
   - Integración completa de Stripe Checkout
   - Página de precios con planes Starter/Profesional/Despacho
   - Gestión de suscripciones (cambio de plan, cancelación)

---

## 16. Apéndice — Recursos y Referencias

- [Poder Judicial de Honduras](https://www.poderjudicial.gob.hn/)
- [Colegio de Abogados de Honduras](https://www.cah.hn/)
- [Tribunal Superior de Cuentas (legislación)](https://www.tsc.gob.hn/)
- [Gaceta Oficial de Honduras](https://www.gaceta.hn/)
- Competidores de referencia: Clio, PracticePanther, MyCase, LegalSoft, Lefebvre
- Inspiración de UI/UX: Linear, Notion, Attio, Clio
- Inspiración de IA: Harvey AI, CoCounsel, Leya AI, Alexi

---

> **Documento vivo y ejecutable**: este documento es la fuente de verdad que Kilo Code lee para entender el proyecto y ejecutar las tareas. Cada cambio relevante (decisión de producto, cambio de arquitectura, nuevo módulo) se actualiza aquí. La IA consulta este documento al inicio de cada sesión de desarrollo.
>
> **Última actualización**: 30 mayo 2026 — Fase 1 completada, repositorio limpio en GitHub. Build verde (0 errores typecheck + 0 errores lint).
