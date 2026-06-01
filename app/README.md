# Justicia Verdadera

> **SaaS de gestion integral con IA para despachos de abogados en Honduras.**
>
> Modo de construccion: solopreneur (Alfons Roiget) + Kilo Code (IA pair programmer).

---

## Estado actual

| Prueba | Resultado |
|---|---|
| `npm run lint` | 0 errores |
| `npm run typecheck` | 0 errores |
| `npm run build` | Exitoso (Turbopack) |
| Fase | 1 completada. Preparando Fase 1.5 |

---

## Stack tecnologico

| Componente | Tecnologia |
|---|---|
| Framework | Next.js 16.2.6 |
| Lenguaje | TypeScript 5 |
| UI | TailwindCSS 4 + shadcn/ui v4 |
| Base de datos | PostgreSQL (Neon DB) + Drizzle ORM v0.45 |
| Auth | NextAuth.js v5 (JWT, Google + Microsoft Entra ID) |
| IA | DeepSeek V4 Flash via Vercel AI SDK v6 |
| Cache | Upstash Redis |
| Email | Resend + React Email |
| Almacenamiento | UploadThing |
| Pagos | Paddle (MoR) — pendiente de activación. Beta: transferencia manual |
| Workflows | Inngest (pospuesto a Fase 2) |

---

## Setup local

### Requisitos

- Node.js ≥20.9 (Next.js 16). **Recomendado para produccion: Node 22 LTS**.
- npm ≥10
- PostgreSQL 15+ (local o Neon DB)

### Instalacion

```bash
cd app
nvm use              # si usas nvm con .nvmrc (recomendado Node 22 LTS)
npm install
cp .env.example .env.local
# Configurar todas las variables de entorno en .env.local
npm run db:push
npm run dev
```

### Configuracion de version de Node

El proyecto recomienda Node 22 LTS. Crear `.nvmrc` en `app/`:

```text
22
```

Y anadir en `package.json`:

```json
"engines": {
  "node": ">=20.9 <25",
  "npm": ">=10"
}
```

### Variables de entorno requeridas

Ver `.env.example` para la lista completa. Las minimas para desarrollo:

```bash
DATABASE_URL=           # Neon DB connection string
AUTH_SECRET=            # NextAuth secret
AUTH_GOOGLE_ID=         # Google OAuth client ID
AUTH_GOOGLE_SECRET=     # Google OAuth client secret
DEEPSEEK_API_KEY=       # DeepSeek API key (solo para features de IA)
```

### Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:3000)
npm run build        # Build de produccion
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npm run test         # Vitest (pendiente Fase 1.5)
npm run db:push      # Sincronizar schema con la BD
npm run db:generate  # Generar migraciones Drizzle
npm run db:studio    # Drizzle Studio (UI para explorar la BD)
```

---

## Estructura del proyecto

```
app/
├── app/              # App Router (paginas, layouts, API routes)
├── components/       # shadcn/ui + componentes propios
├── database/         # Schema Drizzle ORM + seed
├── hooks/            # React Query hooks (6 modulos)
├── lib/              # Logica de negocio (auth, db, billing, inngest, utils)
├── stores/           # Zustand stores
├── types/            # TypeScript types compartidos
├── .env.example      # Plantilla de variables de entorno
└── .env.local        # Variables de entorno (NO commitear)
```

---

## Fases del proyecto

| Fase | Estado | Descripcion |
|---|---|---|
| 0 | ✅ Completada | Setup, Next.js 16, Drizzle, NextAuth, shadcn/ui |
| 1 | ✅ Completada | MVP Core: 6 modulos, API REST, auth auto-provisioning, dashboard |
| 1.5 | 🔜 En curso | Subida documentos + OCR async + hardening (~2-4 semanas, 5 subfases) |
| 2 | Planificada | IA juridica, pipeline documental, automatizaciones (~2 meses) |
| 3 | Planificada | Escalado: portal cliente, PWA, firma electronica, multi-idioma |
| 4 | Vision | Crecimiento regional, API publica, certificaciones |

---

## Crawler Autonomo — Corpus Legal v3.0

**OpenCode puede no tener Internet.** Solo URLs externamente verificadas van en `URLS_FIJAS_CORE`. El resto se valida en runtime con `--validate-sources`.

### Estructura de fuentes

| Bloque | Cantidad | Procesa por defecto |
|---|---|---|
| `URLS_FIJAS_CORE` | 15 PDFs directos | ✅ `--only-fixed` |
| `URLS_FIJAS_COMPLEMENTARIAS` | 4 PDFs | `--include-complementary` |
| `URLS_FIJAS_PENDIENTES` | 5 pendientes | `--include-pending` |
| `SEEDS_OFICIALES` | 14+ sitios | `--only-seeds` |

### Comandos

```bash
# Diagnostico sin descargar
python crawler.py --once --dry-run

# Validar fuentes core (sin descargar)
python crawler.py --once --validate-sources --dry-run

# Solo URLs fijas core
python crawler.py --once --only-fixed --no-ai

# Core + complementarias
python crawler.py --once --only-fixed --include-complementary --no-ai

# Solo semillas
python crawler.py --once --only-seeds --no-ai --max-pages 3

# Bucle continuo
python crawler.py

# Reprocesar PDFs existentes
python crawler.py --once --reprocess-existing --no-ai
```

**Variables:** `DATABASE_URL`, `DEEPSEEK_API_KEY` (en `app/.env.local`). Modelo: `deepseek-v4-flash`.  
**Dependencias Python:** `pip install -r requirements.txt` — `lxml` recomendado (fallback `html.parser`).

**Carpetas usadas** (`app/corpus_data/`):
- `pdfs/` — PDFs descargados
- `textos/` — texto extraido
- `metadata/` — JSON con metadatos por documento
- `logs/` — crawler.log
- `_stats.js` — estadisticas del corpus (no modificar)

---

## Documentacion completa

El plan de ejecucion detallado esta en [`master.md`](../master.md) en la raiz del workspace.
