# Justicia Verdadera — Instrucciones para Kilo Code

> Proyecto: SaaS de gestión legal con IA para despachos de abogados en Honduras.
> Stack: Next.js 16 + TypeScript + PostgreSQL + DeepSeek V4 Flash.
> Fase actual: Fase 1 — MVP Core.

---

## Estructura del proyecto

```
workspace/
├── .gitignore         ← ignora node_modules, .env*, .next
├── master.md          ← plan de ejecución (leer al inicio de cada sesión)
├── apis.md            ← guía de obtención de API keys
├── app/               ← proyecto Next.js 16 (workdir para npm run, npx, etc.)
│   ├── app/           ← App Router (páginas, layouts, API routes)
│   ├── components/    ← shadcn/ui + componentes propios
│   ├── lib/           ← lógica de negocio (auth, db, billing, inngest, utils)
│   ├── database/      ← schema Drizzle ORM + seed
│   ├── hooks/         ← React Query hooks (6 módulos)
│   ├── types/         ← TypeScript types compartidos
│   ├── .env.local     ← variables de entorno (no commitear)
│   └── .env.example   ← plantilla de variables
└── .kilo/             ← configuración de Kilo Code
```

## Cómo trabajo

1. **Antes de empezar cualquier tarea**, leo `master.md` para entender el estado actual y el roadmap.
2. **Cuando necesito API keys**, consulto `apis.md` para saber cómo obtenerlas.
3. **El código vive en `app/`**. Todos los comandos (`npm run dev`, `npx next build`, etc.) se ejecutan con `workdir: app`.
4. **Commits atómicos**: un cambio lógico = un commit con mensaje descriptivo.
5. **Simplicidad primero**: sin sobre-ingeniería. MVP pragmático.

## Base de datos

- **ORM**: Drizzle ORM v0.45
- **Host**: Neon DB serverless (PostgreSQL)
- **Schema**: 18 tablas en `database/schema.ts`
- **Migrar**: `npx drizzle-kit push` (workdir: `app`)

## Servicios externos configurados

| Servicio | Variable | Estado |
|---|---|---|
| Neon DB | `DATABASE_URL` | ✅ |
| DeepSeek V4 | `DEEPSEEK_API_KEY` | ✅ |
| Upstash Redis | `UPSTASH_REDIS_*` | ✅ |
| Resend | `RESEND_API_KEY` | ✅ |
| Stripe | `STRIPE_SECRET_KEY` | ✅ |
| UploadThing | `UPLOADTHING_TOKEN` | ❌ Token inválido |

## Convenciones de código

- **TypeScript estricto**: `tsconfig.json` con `strict: true`
- **Formato**: Prettier con `prettier-plugin-tailwindcss`
- **UI**: TailwindCSS 4 + shadcn/ui v4 (style: base-nova)
- **Fuentes**: Playfair Display (display) + DM Sans (body)
- **Paleta**: Navy `#080b12` + oro `#c8a45c` + acero `#7ea8c4`
- **Animaciones**: definidas en `globals.css`, usar clases `animate-fade-in-up`, `stagger-N`, `glass-card`, etc.

## No hacer

- No usar OpenAI ni Anthropic — el provider es DeepSeek V4 Flash
- No instalar Sentry ni PostHog — retirados del proyecto
- No depender de Stripe CLI ni webhooks locales — Kilo Code gestiona todo
- No usar `middleware.ts` — Next.js 16 usa `proxy.ts`
- No crear archivos de documentación sin pedirlo explícitamente
