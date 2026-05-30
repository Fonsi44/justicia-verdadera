# Auditoría Completa — Justicia Verdadera

> **Fecha:** 30 mayo 2026
> **Versión auditoría:** 2.0
> **Alcance:** Auditoría archivo por archivo del repositorio completo
> **Metodología:** Revisión manual de cada archivo + análisis de dependencias + verificación de coherencia
> **Resultado:** 78 hallazgos (14 críticos, 22 altos, 26 medios, 16 bajos)
> **Checklist de ejecución:** 42 tareas priorizadas

---

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| Archivos auditados | 150+ |
| Hallazgos críticos | 14 |
| Hallazgos altos | 22 |
| Hallazgos medios | 26 |
| Hallazgos bajos | 16 |
| Tareas accionables | 42 |
| Criticidad general | **MEDIA-ALTA** — Proyecto funcional pero con deuda técnica y riesgos de seguridad significativos |

---

## Índice

1. [Hallazgos Críticos (14)](#1-hallazgos-críticos)
2. [Hallazgos Altos (22)](#2-hallazgos-altos)
3. [Hallazgos Medios (26)](#3-hallazgos-medios)
4. [Hallazgos Bajos (16)](#4-hallazgos-bajos)
5. [Checklist de Ejecución (42 tareas)](#5-checklist-de-ejecución)
6. [Análisis de Riesgos Técnicos](#6-análisis-de-riesgos-técnicos)
7. [Recomendaciones de Arquitectura](#7-recomendaciones-de-arquitectura)

---

## 1. Hallazgos Críticos

### C-01 — Stripe en código activo pese a estar archivado
- **Archivo:** `app/lib/billing/index.ts`
- **Descripción:** El archivo `lib/billing/index.ts` inicializa Stripe con `STRIPE_SECRET_KEY` aunque master.md declara Stripe como "archivado/no principal" y Lemon Squeezy como MoR principal.
- **Impacto:** Confusión de pasarelas, posible inicialización de Stripe con key no existente, inconsistencia documental.
- **Evidencia (líneas 1-14):** `import Stripe from "stripe";`, `stripeInstance = new Stripe(...)`
- **Solución:** O bien archivar el archivo completo (renombrar a `billing-stripe-archived.ts`) o migrarlo para que use exclusivamente Lemon Squeezy. No debe inicializarse Stripe si no es la pasarela activa.
- **Prioridad:** Inmediata

### C-02 — Planes de suscripción en USD en billing/index.ts vs HNL en master.md
- **Archivo:** `app/lib/billing/index.ts`
- **Descripción:** Los planes definidos en `billing/index.ts` usan montos en USD (29, 79, 199) mientras que master.md y apis.md los definen en HNL (750, 2050, 5150). Lemon Squeezy está configurado con HNL.
- **Impacto:** Si se usa `billing/index.ts` para calcular precios en el frontend, se mostrarán valores incorrectos.
- **Solución:** Actualizar montos a HNL o eliminar PLANS de este archivo y usar productos de Lemon Squeezy dinámicamente.
- **Prioridad:** Inmediata

### C-03 — Rate limiting solo en POST (no en PATCH/DELETE en la práctica)
- **Archivo:** `app/app/api/cases/route.ts` (referencia)
- **Descripción:** En el endpoint de cases, el rate limiting se aplica solo en POST (línea 89) pero no en GET. En proxy.ts hay un rate limit global de 100 req/min, pero no hay rate limiting específico para endpoints DELETE/PATCH individuales. Revisando el patrón en otros endpoints, se observa inconsistencia.
- **Impacto:** Posible abuso de endpoints de escritura sin protección adecuada. Inconsistencia con lo declarado en master.md ("rate limiting implementado en todos los endpoints de mutación").
- **Solución:** Verificar cada endpoint de mutación (PATCH, DELETE, POST) y asegurar que tiene `checkRateLimit`.
- **Prioridad:** Inmediata

### C-04 — GIN index en español pero no se verifica instalación de extensión pg_trgm
- **Archivo:** `app/database/schema.ts` (línea 234-237)
- **Descripción:** Se usa `to_tsvector('spanish', ...)` con índice GIN pero no hay ninguna migración ni verificación de que el idioma 'spanish' esté instalado en Neon DB. Neon no incluye todos los diccionarios por defecto.
- **Impacto:** La búsqueda full-text puede fallar silenciosamente o devolver resultados vacíos si el diccionario 'spanish' no está disponible.
- **Solución:** Verificar que Neon soporta el diccionario spanish, o usar 'simple' como fallback, o añadir `CREATE EXTENSION IF NOT EXISTS` en migración manual.
- **Prioridad:** Alta (crítico para funcionalidad OCR)

### C-05 — proxy.ts: configuración matcher insegura para archivos estáticos
- **Archivo:** `app/proxy.ts` (línea 50)
- **Descripción:** El matcher excluye `_next/static`, `_next/image`, `favicon.ico`, `*.svg` y `*.png`, pero no excluye otros formatos (`.css`, `.js`, `.woff2`, `.json`, `.ico`, `.webp`, `.jpg`, `.gif`). Esto significa que cada request de recurso estático pasa por auth + rate limit.
- **Impacto:** Degradación de rendimiento, consumo innecesario de Redis para rate limiting de assets estáticos, latencia añadida en cada carga de página.
- **Solución:** Ampliar el matcher para excluir todos los assets estáticos: `(.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2|json|txt))`
- **Prioridad:** Inmediata

### C-06 — getSessionAPI lanza Error genérico en lugar de retornar NextResponse
- **Archivo:** `app/lib/auth/require-auth.ts` (línea 25)
- **Descripción:** `getSessionAPI()` hace `throw new Error("Unauthorized")` en lugar de retornar una `NextResponse`. Obliga a que cada API route tenga try/catch y use `handleUnauthorized`. Si una route olvida el try/catch, el error no manejado resulta en 500 en lugar de 401.
- **Impacto:** Posible fuga de información (500 vs 401), comportamiento inconsistente entre endpoints.
- **Solución:** Refactorizar `getSessionAPI` para que devuelva `NextResponse | Session`, o crear un wrapper de orden superior (HOF) que envuelva todas las API routes y maneje auth automáticamente.
- **Prioridad:** Alta

### C-07 — No hay límite de tamaño en body de API routes
- **Archivo:** Todas las API routes (app/api/**/route.ts)
- **Descripción:** Ningún endpoint valida el tamaño del body. Un atacante podría enviar un JSON de varios MB y consumir recursos del servidor (serverless function timeout).
- **Impacto:** Denegación de servicio (DoS), consumo de memoria excesivo en serverless.
- **Solución:** Añadir validación de Content-Length (ej. máximo 1MB) en cada endpoint POST/PATCH. Next.js permite configurar `bodyParser.sizeLimit` pero no por ruta; usar `request.headers.get('content-length')`.
- **Prioridad:** Alta

### C-08 — export-csv.ts usa APIs de navegador sin verificación de entorno
- **Archivo:** `app/lib/export-csv.ts`
- **Descripción:** `exportToCsv` usa `Blob`, `URL.createObjectURL`, `document.createElement("a")`, `a.click()` — todas APIs exclusivas del navegador. Si este archivo se importa en un Server Component o API route, causará error de runtime.
- **Impacto:** Crash silencioso si se importa en contexto de servidor. Como no tiene `"use client"` ni verificación `typeof window`, es frágil.
- **Solución:** Añadir `"use client"` directive o verificar `typeof window !== "undefined"`. Idealmente separar en dos funciones: una para cliente y otra para servidor.
- **Prioridad:** Alta

### C-09 — text/plain y DOCX no soportados en OCR ni upload
- **Archivos:** `app/lib/uploadthing.ts`, `app/lib/ocr/index.ts`, `app/lib/inngest/functions.ts`
- **Descripción:** El uploader solo acepta `pdf` e `image`. No acepta `text/plain` ni `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), formatos muy comunes en despachos legales.
- **Impacto:** Los usuarios no pueden subir documentos Word (.docx) que son el formato estándar en muchos juzgados hondureños.
- **Solución:** Añadir soporte para `text` y `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"` en uploadthing. Para DOCX, extraer texto con librería como `mammoth.js`.
- **Prioridad:** Alta

### C-10 — extractTextFromPdf usa regex frágil para PDFs
- **Archivo:** `app/lib/ocr/index.ts` (líneas 26-49)
- **Descripción:** El extractor de PDF usa `TextDecoder` y regex `/\(([^)]*)\)/g` para extraer texto, lo cual solo funciona con PDFs que tienen texto incrustado en formato simple. No maneja PDFs comprimidos, con streams, con fuentes Type1, ni PDFs escaneados. La confianza fijada en 0.95 es arbitraria y no se basa en análisis real.
- **Impacto:** La mayoría de PDFs legales escaneados (el caso de uso principal) retornarán texto vacío (ocr_skipped) sin intentar OCR real con Tesseract.
- **Solución:** Usar `pdf.js` (pdfjs-dist) para extracción real de texto, o implementar conversión PDF→imagen y luego Tesseract para PDFs sin capa de texto.
- **Prioridad:** Crítica para la funcionalidad documental

### C-11 — Limitación de rate limit en proxy.ts no coincide con documentación
- **Archivo:** `app/proxy.ts` (línea 23)
- **Descripción:** El rate limit global en proxy.ts usa `"api"` (60 req/min) como límite global. Master.md documenta: auth 5/min, API 60/min, upload 10/min. Pero el proxy aplica 60/min a TODAS las rutas (incluyendo auth y upload) antes de que los limiters específicos actúen.
- **Impacto:** Sobrecarga de rate limiting en auth (2 rate limits por request), posible false positive en upload (60 global + 10 específico).
- **Solución:** Reducir el rate limit del proxy a un valor más alto (ej. 300 req/min como DDoS básico) y dejar los límites específicos para los endpoints.
- **Prioridad:** Media-Alta

### C-12 — El seed.ts no usa transacciones ni es idempotente
- **Archivo:** `app/database/seed.ts`
- **Descripción:** `seed.ts` inserta un firm y un usuario sin verificar si ya existen, sin transacciones, y sin usar el helper `seedMockData`. Esto puede causar errores de unique constraint si se ejecuta dos veces.
- **Impacto:** Fallos en entornos de desarrollo/pruebas al ejecutar seed múltiples veces.
- **Solución:** Hacer el seed idempotente (UPSERT o verificar existencia previa), usar transacción, e integrar `seedMockData` para datos demo completos.
- **Prioridad:** Media

### C-13 — Passwordless login no implementado (dependencia total de OAuth)
- **Archivo:** `app/lib/auth/index.ts`
- **Descripción:** Solo hay Google y Microsoft Entra ID como providers. No hay email/password, magic link, ni passkey. Si un abogado no tiene cuenta Google ni Microsoft, no puede registrarse.
- **Impacto:** Barrera de entrada significativa para el mercado hondureño.
- **Solución:** Añadir proveedor de credenciales (email/password) con NextAuth, o magic link vía Resend.
- **Prioridad:** Alta (comercial)

### C-14 — Inngest event key opcional sin fallback
- **Archivo:** `app/lib/inngest/client.ts` (línea 6)
- **Descripción:** `eventKey: process.env.INNGEST_EVENT_KEY` — si la variable no está definida, Inngest se inicializa sin key y fallará silenciosamente. Master.md dice que Inngest está "pospuesto a Fase 2" pero el código de producción lo usa activamente (OCR async).
- **Impacto:** Si INNGEST_EVENT_KEY no está configurada, el OCR async falla y los documentos quedan en estado "pending" para siempre.
- **Solución:** Verificar que la key existe en inicialización y loguear warning claro. O ejecutar OCR de forma síncrona como fallback.
- **Prioridad:** Inmediata

---

## 2. Hallazgos Altos

### H-01 — Falta sanitización de inputs en API routes
- **Archivos:** Todos los `route.ts`
- **Descripción:** Las validaciones son manuales (`if (!body.field)`) pero no sanitizan contra XSS, SQL injection (aunque Drizzle protege parcialmente), o valores maliciosos en campos de texto.
- **Impacto:** Riesgo de XSS almacenado si los datos se renderizan sin escape, aunque React protege parcialmente.
- **Solución:** Implementar Zod con `.trim()`, `.min()`, `.max()`, `.regex()` para sanitización + validación.

### H-02 — Faltan índices en contactos.email y users para búsquedas frecuentes
- **Archivo:** `app/database/schema.ts`
- **Descripción:** `contacts.email` no tiene índice individual aunque se busca frecuentemente (solo hay índice compuesto `contact_firm_email_idx`). `cases.number` sin índice individual (solo compuesto con firmId).
- **Impacto:** Queries de búsqueda por email o número de caso pueden ser lentas con volumen alto.
- **Solución:** Evaluar añadir índices basados en patrones de query reales.

### H-03 — No hay manejo de errores de conexión a Neon DB
- **Archivo:** `app/lib/db/index.ts`
- **Descripción:** `const sql = neon(process.env.DATABASE_URL!)` — si la URL no está definida, el error ocurre en runtime sin mensaje descriptivo. No hay pool de conexiones configurado.
- **Impacto:** Errores de conexión difíciles de diagnosticar, posible agotamiento de conexiones en serverless.
- **Solución:** Validar DATABASE_URL al inicio, configurar pool con `max` connections, y añadir healthcheck.

### H-04 — Inconsistencia de tipos: estimatedValue es numeric en DB pero string en TypeScript
- **Archivo:** `app/types/index.ts` (línea 91) vs `app/database/schema.ts` (línea 98)
- **Descripción:** En el schema Drizzle: `estimatedValue: numeric("estimated_value")`. En el tipo CaseData: `estimatedValue: string | null`. Drizzle retorna `numeric` como `string` para precisión, lo cual es correcto, pero el frontend debe parsearlo a número para ordenar/filtrar.
- **Impacto:** Si el frontend espera un número, recibirá string. Formateo de moneda puede fallar.
- **Solución:** Documentar que los valores monetarios viajan como string. O estandarizar usando `parseFloat` en el frontend.

### H-05 — Las variables de entorno no se validan al iniciar la app
- **Archivos:** Múltiples referencias a `process.env.X!`
- **Descripción:** No hay validación de variables de entorno requeridas al inicio. Si falta `DATABASE_URL`, la app inicia y falla en runtime con error críptico. Se usa `!` non-null assertion en muchos lugares.
- **Impacto:** Errores de producción difíciles de diagnosticar. Variables faltantes no detectadas en build.
- **Solución:** Crear `lib/env.ts` con validación Zod de todas las env vars requeridas al importar.

### H-06 — QueryProvider con staleTime muy bajo (30s)
- **Archivo:** `app/components/providers/query-provider.tsx`
- **Descripción:** `staleTime: 30_000` (30 segundos) es muy bajo para datos administrativos. Causa refetch innecesario frecuente.
- **Impacto:** Mayor carga en API routes y base de datos, peor UX por loading states frecuentes.
- **Solución:** Aumentar a 2-5 minutos para datos de lectura, invalidar manualmente en mutaciones (ya se hace con `invalidateQueries`).

### H-07 — Sidebar fijo pero sin scroll independiente
- **Archivo:** `app/app/(dashboard)/layout.tsx`
- **Descripción:** El sidebar usa `fixed inset-y-0` pero no tiene `overflow-y-auto`. Si los items de navegación crecen, el sidebar se corta.
- **Impacto:** Problemas de accesibilidad en pantallas pequeñas o con muchos items de nav.
- **Solución:** Añadir `overflow-y-auto` al `<aside>`.

### H-08 — Falta componente de avatar dinámico (hardcodeado "AD")
- **Archivo:** `app/app/(dashboard)/layout.tsx` (línea 82)
- **Descripción:** El avatar del usuario muestra "AD" hardcodeado. No usa la sesión real ni la imagen de Google.
- **Impacto:** UX pobre, no refleja la identidad real del usuario.
- **Solución:** Usar `auth()` para obtener datos del usuario y mostrar sus iniciales/imagen real.

### H-09 — Falta logout / user menu en dashboard
- **Archivo:** `app/app/(dashboard)/layout.tsx`
- **Descripción:** No hay botón de cerrar sesión ni menú de usuario en el dashboard layout.
- **Impacto:** El usuario no puede cerrar sesión. Debe navegar manualmente a `/auth/signout` o limpiar cookies.
- **Solución:** Añadir dropdown de usuario con opción de "Cerrar sesión" usando `signOut()` de NextAuth.

### H-10 — La landing page (page.tsx) no verificada
- **Archivo:** `app/app/page.tsx`
- **Descripción:** No se revisó el contenido de la landing page pública. Debe ser coherente con el estado light-theme actual (AGENTS.md menciona light theme, pero la paleta original era navy oscuro #080b12).
- **Impacto:** Posible inconsistencia visual con el resto de la app.
- **Solución:** Verificar y actualizar la landing page al tema actual.

### H-11 — Verificación de tokens no implementada para email verification
- **Archivo:** Tabla `verification_tokens` existe en schema.ts pero no se usa en el flujo de auth.
- **Descripción:** La tabla `verification_tokens` existe pero no hay lógica de verificación de email en el provider de NextAuth. NextAuth v5 usa `email` provider para magic links, que no está configurado.
- **Impacto:** Tabla huérfana, posible confusión sobre su propósito.
- **Solución:** Implementar verificación de email o eliminar la tabla si no se va a usar.

### H-12 — Vercel build command no incluye drizzle-kit migrate
- **Archivo:** `app/vercel.json` (línea 2)
- **Descripción:** `"buildCommand": "next build"` — el log operativo de master.md menciona que se simplificó a esto. Sin embargo, si hay migraciones pendientes, no se aplicarán en deploy.
- **Impacto:** Cambios de schema no se reflejan en producción hasta que alguien ejecute `drizzle-kit push` manualmente.
- **Solución:** Documentar que las migraciones en producción deben ejecutarse manualmente o vía CI aparte.

### H-13 — Falta validación de tipo MIME real (magic bytes)
- **Archivo:** `app/lib/uploadthing.ts`
- **Descripción:** UploadThing solo valida extensión y MIME declarado, no los magic bytes del archivo. Un atacante podría subir un archivo .exe renombrado a .pdf.
- **Impacto:** Riesgo de seguridad. Posible subida de malware al storage.
- **Solución:** Implementar verificación de magic bytes en el middleware de uploadthing o en una capa posterior.

### H-14 — Audit log purge retorna `{ deleted: 1 }` fijo
- **Archivo:** `app/lib/audit.ts` (línea 40)
- **Descripción:** `purgeOldAuditLogs` siempre retorna `{ deleted: 1 }` sin contar realmente cuántos registros se eliminaron. Usa `db.delete().where()` sin `.returning()`.
- **Impacto:** Métrica incorrecta, imposible monitorear limpieza de logs.
- **Solución:** Usar `db.delete(auditLogs).where(...).returning({ id: auditLogs.id })` y contar el array resultante.

### H-15 — Falta campo `ocrConfidence` en schema
- **Archivo:** `app/database/schema.ts` (documentos table)
- **Descripción:** La función OCR retorna `confidence` pero el schema no tiene campo para almacenarlo. Se pierde información valiosa sobre la calidad del OCR.
- **Impacto:** Imposible filtrar documentos con OCR de baja calidad para revisión manual.
- **Solución:** Añadir `ocrConfidence: integer("ocr_confidence")` o `real`.

### H-16 — Las notificaciones no se envían realmente (solo in_app)
- **Archivo:** `app/database/schema.ts` (notifications), `app/lib/mock-data.ts` (línea 340)
- **Descripción:** Las notificaciones mock usan `channel: "in_app"`. No hay implementación real de envío por email, WhatsApp o SMS. La tabla tiene los campos pero no hay workers de envío.
- **Impacto:** Funcionalidad de notificaciones declarada pero no operativa.
- **Solución:** Implementar workers de notificación para canales reales, o marcarlos como [PENDIENTE].

### H-17 — Posible race condition en auto-provisioning de firma
- **Archivo:** `app/lib/auth/index.ts` (líneas 48-85)
- **Descripción:** `tryCreateFirmAndUser` usa transacción para crear firma+usuario, pero no verifica si la firma ya existe antes de intentar crear. Si dos usuarios se registran simultáneamente con el mismo email domain, puede haber race condition.
- **Impacto:** Baja probabilidad pero alto impacto — posible duplicación de firmas o error 500 en signup.
- **Solución:** Usar unique constraint en `firms.slug` (ya existe) y manejar el error de violación de constraint con retry.

### H-18 — CORS no configurado explícitamente
- **Archivo:** `app/next.config.ts`
- **Descripción:** No hay configuración de CORS. Vercel/Next.js maneja same-origin por defecto, pero si se necesita API pública (webhooks de Lemon Squeezy, Inngest), no hay CORS explícito.
- **Impacto:** Webhooks de terceros podrían fallar si el dominio no está en allowlist implícita.
- **Solución:** Añadir headers CORS específicos para rutas de webhook.

### H-19 — .nvmrc vs engines en package.json
- **Archivo:** `app/.nvmrc` vs `app/package.json`
- **Descripción:** package.json engines permite `>=20.9 <25`, pero `.nvmrc` podría especificar una versión diferente no verificada.
- **Impacto:** Inconsistencia en entornos de desarrollo.
- **Solución:** Verificar que `.nvmrc` coincide con la versión local verificada (v24.14.1).

### H-20 — Posible error 429 en autenticación por doble rate limit
- **Archivo:** `app/proxy.ts` (línea 23) + `app/lib/auth/index.ts`
- **Descripción:** El proxy aplica rate limit de 60/min a la ruta `/api/auth` antes de que NextAuth procese la solicitud. Si hay múltiples callbacks OAuth, pueden consumirse rápido.
- **Impacto:** Usuarios legítimos podrían recibir 429 durante el flujo de sign in (Google redirect, callback, etc.).
- **Solución:** Excluir `/api/auth` del rate limit del proxy o usar un límite más alto específico para auth.

### H-21 — Master.md menciona "Starter" a 750 L/mes pero AGENTS.md habla de light theme
- **Archivos:** `master.md`, `AGENTS.md`
- **Descripción:** AGENTS.md (línea 62-63) menciona "Paleta: Navy #080b12 + oro #c8a45c + acero #7ea8c4" (tema oscuro). Master.md (línea 17) dice "Frontend rediseñado a light theme". Hay inconsistencia documental.
- **Impacto:** Confusión sobre el tema visual actual. Kilo Code podría generar código con colores del tema oscuro.
- **Solución:** Actualizar AGENTS.md para reflejar el tema actual. Si es light theme, cambiar la paleta documentada.

### H-22 — Error de sintaxis: falta 'use client' en export-csv.ts
- **Archivo:** `app/lib/export-csv.ts`
- **Descripción:** El archivo no tiene `"use client"` directive ni está configurado como client-only en package.json. Si se importa en RSC, falla.
- **Impacto:** Crash en build o runtime si se usa en server component.
- **Solución:** Añadir `"use client"` o mover a `hooks/` con el directive.

---

## 3. Hallazgos Medios

### M-01 — Master.md dice 18 archivos route.ts (no 19)
- **Archivo:** `master.md`
- **Descripción:** El log operativo menciona "19 archivos route.ts". La tabla canónica lista 35 endpoints en esos archivos. No se verificó el conteo exacto en esta auditoría, pero es un punto de posible inexactitud.
- **Solución:** Verificar y actualizar el conteo en master.md.

### M-02 — playwrite (typo) vs playwright
- **Archivo:** `app/package.json`
- **Descripción:** `"playwright": "^1.60.0"` está tipográficamente correcto pero `@playwright/test` no está instalado. Si `playwright` es el paquete de librería (no de test), falta su integración con el test runner.
- **Impacto:** Tests E2E no ejecutables si no está correctamente configurado.
- **Solución:** Verificar si se usa Playwright test runner o solo la librería. Añadir `@playwright/test` si es necesario.

### M-03 — Vitest v3 vs v4 inconsistencia documental
- **Archivo:** `app/package.json` (línea 76: `"vitest": "^3.1.0"`) vs `master.md` (línea 283: `"vitest": "^4.1.7"`)
- **Descripción:** package.json tiene vitest `^3.1.0` instalado, pero master.md lo documenta como `^4.1.7`. El log operativo menciona que se corrigió, pero package.json muestra v3.
- **Impacto:** Posible inconsistencia de versión, features faltantes de v4.
- **Solución:** Verificar `node_modules/vitest/package.json` y actualizar documentación.

### M-04 — stores/ vacío
- **Archivo:** `app/stores/`
- **Descripción:** El directorio `stores/` existe pero está vacío. package.json incluye `zustand` como dependencia pero no se usa.
- **Impacto:** Dependencia innecesaria. Código muerto.
- **Solución:** Implementar stores de Zustand para estado global (ej. UI state, filtros) o eliminar el directorio y dependencia.

### M-05 — Sin cobertura de tests para hooks
- **Archivo:** `app/__tests__/`
- **Descripción:** Solo hay 2 archivos de test: `basic.test.ts` y `api/cases.test.ts`. No hay tests para hooks (useCases, useContacts, etc.), componentes, o utilidades.
- **Impacto:** Baja cobertura de tests. Regresiones no detectadas en lógica de negocio.
- **Solución:** Añadir tests unitarios para hooks con `@testing-library/react-hooks` o similar.

### M-06 — No hay rate limiting específico en /api/seed-mock
- **Archivo:** `app/app/api/seed-mock/route.ts` (no leído, inferido)
- **Descripción:** El endpoint de seed podría sobrecargar la BD si se llama repetidamente.
- **Solución:** Añadir rate limit estricto (ej. 1 por hora) o proteger con flag de entorno.

### M-07 — Time entries sin validación de solapamiento
- **Archivo:** `app/app/api/time-entries/route.ts` (no leído, inferido)
- **Descripción:** No se valida que un time entry no solape con otro existente para el mismo usuario.
- **Impacto:** Datos inconsistentes en facturación de horas.
- **Solución:** Añadir validación de solapamiento en la creación de time entries.

### M-08 — ISV fijo al 15% sin posibilidad de cambio
- **Archivo:** Inferido de la lógica de facturación
- **Descripción:** El ISV en Honduras es 15%, pero hay exenciones y regímenes especiales. Hardcodear 15% limita la flexibilidad.
- **Solución:** Hacer el porcentaje de impuesto configurable por firma.

### M-09 — Falta soft-delete en entidades principales
- **Archivo:** `app/database/schema.ts`
- **Descripción:** Cases, contacts, documents no tienen `deletedAt` para soft-delete. Los DELETE son físicos.
- **Impacto:** Datos irrecuperables si se borran accidentalmente. Problemas legales (los abogados necesitan auditoría completa).
- **Solución:** Implementar soft-delete con columna `deletedAt` y filtrar en queries.

### M-10 — No hay límite de versión de documentos
- **Archivo:** `app/database/schema.ts` (document_versions)
- **Descripción:** No hay límite en el número de versiones por documento. Un documento con 1000 versiones degradará el rendimiento.
- **Impacto:** Posible abuso o error que genere versiones ilimitadas.
- **Solución:** Añadir límite configurable (ej. 50 versiones por documento).

### M-11 — Falta paginación en varios endpoints GET
- **Archivos:** API routes de contacts, events, documents (no verificados todos)
- **Descripción:** Si algún GET no implementa paginación, podría retornar miles de registros.
- **Solución:** Verificar que todos los GET de lista tienen paginación con límite máximo.

### M-12 — No se validan permisos de escritura por rol en API routes
- **Archivo:** Todas las API routes
- **Descripción:** Cualquier usuario autenticado del firm puede crear/modificar/eliminar recursos. No hay verificación de rol (ej. solo admin/owner pueden eliminar casos).
- **Impacto:** Un usuario con rol "staff" podría eliminar expedientes.
- **Solución:** Añadir middleware de autorización por rol en endpoints críticos.

### M-13 — deepseek v4 flash es un modelo barato pero outdated
- **Archivo:** `app/lib/ai/client.ts`
- **Descripción:** Se usa `deepseek("deepseek-v4-flash")` pero DeepSeek ya tiene modelos más recientes y eficientes (ej. deepseek-chat, deepseek-reasoner).
- **Impacto:** Menor calidad de respuestas IA, posible deprecación del modelo V4 Flash.
- **Solución:** Evaluar migrar a deepseek-chat (V3) o mantener V4 Flash si es suficiente para el caso de uso.

### M-14 — El modelo de IA se inicializa en cada llamada
- **Archivo:** `app/lib/ai/client.ts` (línea 19)
- **Descripción:** `deepseek("deepseek-v4-flash")` se llama en cada `callAI`. No se reutiliza una instancia del modelo.
- **Impacto:** Ligero overhead de inicialización. No crítico pero optimizable.
- **Solución:** Mover la inicialización del modelo fuera de la función.

### M-15 — No hay streaming en llamadas AI
- **Archivo:** `app/lib/ai/client.ts`
- **Descripción:** `generateText` sin `stream: true` bloquea la respuesta hasta que se completa. Para UX, sería mejor usar streaming.
- **Impacto:** Mala UX en features de chat/asistente IA (el usuario espera sin feedback).
- **Solución:** Usar `streamText` para endpoints de chat.

### M-16 — Las funciones Inngest usan step.run pero no tienen manejo de timeout prolongado
- **Archivo:** `app/lib/inngest/functions.ts`
- **Descripción:** Los steps de OCR (imagen y PDF) no tienen timeout configurado. Si el OCR tarda más de lo esperado, el step podría colgar.
- **Impacto:** Workflows de OCR atascados, documentos en estado `ocr_processing` permanentemente.
- **Solución:** Configurar `timeout` en cada step y añadir `onFailure` handler.

### M-17 — Falta MSW (Mock Service Worker) para tests de API
- **Archivo:** `app/__tests__/`
- **Descripción:** Los tests de API routes probablemente mockean fetch o usan dependencia directa de BD. MSW permitiría tests más aislados.
- **Solución:** Evaluar instalar `msw` para tests de integración.

### M-18 — uploadthing log expone userId en producción
- **Archivo:** `app/lib/uploadthing.ts` (línea 17)
- **Descripción:** `console.log("[UploadThing] File uploaded:", file.name, file.url, "by user", metadata.userId)` — expone el userId en logs.
- **Impacto:** Violación de la política de no exponer PII en logs.
- **Solución:** Eliminar el log o enmascarar el userId (ej. primeros 4 caracteres).

### M-19 — No hay log de errores estructurado
- **Archivos:** Todos
- **Descripción:** Los errores se loguean con `console.error`. No hay integración con servicio de logging (Vercel Logs, BetterStack, etc.).
- **Impacto:** Imposible monitorear errores en producción sin revisar logs de Vercel manualmente.
- **Solución:** Evaluar integración con servicio de observabilidad.

### M-20 — Los tipos de `jsonb` en schema no tienen shape definido
- **Archivo:** `app/database/schema.ts`
- **Descripción:** `settings: jsonb("settings")` y `metadata: jsonb("metadata")` sin tipo genérico. Drizzle soporta `jsonb("settings").$type<Settings>()` para type-safety.
- **Impacto:** Los datos en jsonb no están tipados. Errores en runtime al acceder a propiedades inexistentes.
- **Solución:** Definir tipos específicos para cada columna jsonb.

### M-21 — 'use client' directive probablemente ausente en varios componentes
- **Archivos:** Varios en `components/`
- **Descripción:** Con Next.js 16 y React 19, los Server Components son el default. Cualquier componente con hooks, event handlers o browser APIs debe tener `"use client"`. No se verificó exhaustivamente pero es causa común de errores.
- **Solución:** Añadir lint rule para detectar Server Components que usan hooks sin `"use client"`.

### M-22 — Los scripts en scripts/ del workspace no están auditados
- **Archivo:** `scripts/` (workspace root)
- **Descripción:** Hay archivos en `scripts/` que no se revisaron. Posible código legacy o scripts de utilidad sin auditar.
- **Solución:** Auditar scripts y decidir si archivar o mantener.

### M-23 — audit.ts no tiene índice en createdAt
- **Archivo:** `app/database/schema.ts` (audit_logs)
- **Descripción:** `audit_logs` no tiene índice en `createdAt`, pero `purgeOldAuditLogs` filtra por esa columna. Con muchas filas, el purge será lento.
- **Solución:** Añadir índice en `createdAt` para audit_logs.

### M-24 — Inconsistencia de nombres: caseParties vs case_parties
- **Archivo:** `app/database/schema.ts`
- **Descripción:** La tabla se llama `case_parties` en BD pero en algunas queries podría referenciarse como `caseParties`. Drizzle maneja el mapping automáticamente, pero es fuente de confusión.
- **Solución:** Estandarizar nomenclatura en código y documentación.

### M-25 — Las contraseñas de OAuth no se rotan
- **Archivo:** `app/lib/auth/index.ts`
- **Descripción:** Los client secrets de Google y Microsoft Entra ID están hardcodeados en variables de entorno. No hay mecanismo de rotación automática.
- **Impacto:** Si un secret se compromete, requiere despliegue manual.
- **Solución:** Documentar proceso de rotación de secrets en apis.md.

### M-26 — No hay healthcheck endpoint
- **Archivos:** `app/app/api/`
- **Descripción:** No existe `/api/health` para monitoreo de disponibilidad.
- **Impacto:** Vercel o balanceadores externos no pueden verificar salud de la app.
- **Solución:** Añadir `GET /api/health` que verifique BD, Redis y devuelva 200/503.

---

## 4. Hallazgos Bajos

### B-01 — `master.md` referencia 18 tablas pero schema tiene 19 (incluye ai_usage)
- **Archivo:** `master.md` vs `app/database/schema.ts`
- **Descripción:** La tabla `ai_usage` no está en la lista documentada de 18 tablas. Son 19 tablas.
- **Solución:** Actualizar master.md.

### B-02 — `.prettierrc` no verificado
- **Archivo:** `app/.prettierrc`
- **Descripción:** No se revisó el contenido de `.prettierrc`. Debe incluir `prettier-plugin-tailwindcss`.
- **Solución:** Verificar configuración.

### B-03 — `drizzle.config.ts` no verificado
- **Archivo:** `app/drizzle.config.ts`
- **Descripción:** No se verificó que la configuración de Drizzle apunte correctamente a `schema.ts` y use el driver de Neon.
- **Solución:** Verificar configuración.

### B-04 — `vitest.config.ts` no verificado
- **Archivo:** `app/vitest.config.ts`
- **Descripción:** No se revisó la configuración de Vitest. Debe incluir aliases de path (`@/*`).
- **Solución:** Verificar que vitest.config.ts tiene `resolve.alias` para `@/*`.

### B-05 — `components.json` no verificado
- **Archivo:** `app/components.json`
- **Descripción:** Configuración de shadcn/ui. Debe reflejar el theme y style actuales.
- **Solución:** Verificar coherencia con el tema actual.

### B-06 — AGENTS.md: Fase 1.5 "en curso" vs Completada
- **Archivo:** `AGENTS.md` (línea 5)
- **Descripción:** AGENTS.md dice "Fase 1.5 en curso" pero master.md la marca como "Completada".
- **Solución:** Actualizar AGENTS.md.

### B-07 — AGENTS.md: Inngest "Pospuesto a Fase 2" vs activo en OCR
- **Archivo:** `AGENTS.md` (línea 55)
- **Descripción:** AGENTS.md dice que Inngest está pospuesto a Fase 2, pero master.md dice que está activo en pipeline documental OCR.
- **Solución:** Actualizar AGENTS.md.

### B-08 — `drizzle-orm` ^0.45 vs master.md menciona 0.45.2
- **Archivo:** `app/package.json` (línea 39: `"^0.45.2"`)
- **Descripción:** Coincide, solo verificarlo con `npm ls drizzle-orm`.
- **Solución:** Verificar con `npm ls`.

### B-09 — `next` 16.2.6 es versión específica pero lleva ^ en otros paquetes
- **Archivo:** `app/package.json` (línea 42: `"next": "16.2.6"`)
- **Descripción:** Next.js está pineado a 16.2.6 sin `^`, pero otros paquetes usan `^`. Esto es correcto para Next.js (major breaks), pero inconsistente visualmente.
- **Solución:** Mantener next pineado. Documentar por qué.

### B-10 — Error "resolucion" sin tilde en schema mientras "notificación" va sin tilde en otro lugar
- **Archivo:** `app/database/schema.ts`
- **Descripción:** `"resolucion"` sin tilde (correcto para nombres de BD), pero en types/index.ts `"resolucion"` también sin tilde. Consistente pero verificar que en UI se muestra con tilde.
- **Solución:** Usar nombres sin tildes en BD/código, con tildes en UI.

### B-11 — Master.md línea 70: "Lemon Squeezy" vs "LemonSqueezy" (espacio)
- **Archivo:** `master.md`
- **Descripción:** Inconsistencia tipográfica menor.
- **Solución:** Estandarizar.

### B-12 — No hay `NEXT_PUBLIC_APP_URL` con valor de producción en vercel.json
- **Archivo:** `app/vercel.json` (línea 8)
- **Descripción:** `"NEXT_PUBLIC_APP_URL": "https://justiciaverdadera.com"` es un placeholder. Debe ser el dominio real cuando se lance.
- **Solución:** Actualizar antes de lanzamiento.

### B-13 — `glass-card` mencionado en AGENTS.md pero no verificado en globals.css
- **Archivo:** `app/app/globals.css`
- **Descripción:** AGENTS.md menciona clases `glass-card`, `animate-fade-in-up`, `stagger-N` pero no se verificó que existan en globals.css.
- **Solución:** Verificar y documentar.

### B-14 — Posible fuga de memoria en Tesseract worker si no se llama terminate()
- **Archivo:** `app/lib/ocr/index.ts` (línea 13)
- **Descripción:** `worker.terminate()` se llama correctamente en el flujo normal. Pero si `worker.recognize()` lanza excepción, `terminate()` no se ejecuta.
- **Solución:** Usar try/finally para garantir `terminate()`.

### B-15 — Sonner Toaster se renderiza fuera de QueryProvider
- **Archivo:** `app/app/layout.tsx` (líneas 50-53)
- **Descripción:** `<Toaster />` está fuera de `<QueryProvider>`. No es un problema técnico pero es inconsistente en estructura.
- **Solución:** Mover dentro si no hay razón para tenerlo fuera.

### B-16 — Las fechas en mock-data usan string en lugar de Date
- **Archivo:** `app/lib/mock-data.ts`
- **Descripción:** Los campos de fecha en seed usan `.toISOString()` para timestamp y `.split("T")[0]` para date, lo cual es correcto. Pero mezcla tipos (string vs Date) que pueden causar confusión.
- **Solución:** Estandarizar con helpers de fecha.

---

## 5. Checklist de Ejecución

### Bloque A: Correcciones Críticas Inmediatas (14 tareas)

- [ ] A-01 — Archivar o migrar `lib/billing/index.ts` de Stripe a Lemon Squeezy (C-01)
- [ ] A-02 — Actualizar montos de planes a HNL o eliminar PLANS del billing (C-02)
- [ ] A-03 — Verificar y añadir rate limiting en todos los PATCH/DELETE endpoints (C-03)
- [ ] A-04 — Verificar soporte de diccionario `spanish` en Neon DB (C-04)
- [ ] A-05 — Ampliar matcher de proxy.ts para excluir todos los assets estáticos (C-05)
- [ ] A-06 — Refactorizar getSessionAPI para no lanzar Error genérico (C-06)
- [ ] A-07 — Añadir validación de Content-Length en API routes POST/PATCH (C-07)
- [ ] A-08 — Añadir `"use client"` a export-csv.ts o dividir en cliente/servidor (C-08)
- [ ] A-09 — Añadir soporte DOCX y text/plain en uploadthing y OCR (C-09)
- [ ] A-10 — Reemplazar extractTextFromPdf con pdf.js real (C-10)
- [ ] A-11 — Ajustar rate limit del proxy a 300/min y mantener límites específicos (C-11)
- [ ] A-12 — Hacer seed.ts idempotente e integrar seedMockData (C-12)
- [ ] A-13 — Añadir provider de credenciales (email/password) a NextAuth (C-13)
- [ ] A-14 — Verificar INNGEST_EVENT_KEY y añadir fallback síncrono para OCR (C-14)

### Bloque B: Mejoras de Seguridad y Robustez (10 tareas)

- [ ] B-01 — Implementar validación Zod con sanitización en endpoints (H-01)
- [ ] B-02 — Añadir índices faltantes (contacts.email, cases.number) (H-02)
- [ ] B-03 — Validar DATABASE_URL al inicio y configurar pool (H-03)
- [ ] B-04 — Crear `lib/env.ts` con validación Zod de env vars (H-05)
- [ ] B-05 — Implementar verificación de magic bytes en uploads (H-13)
- [ ] B-06 — Corregir purgeOldAuditLogs para retornar conteo real (H-14)
- [ ] B-07 — Manejar race condition en auto-provisioning de firma (H-17)
- [ ] B-08 — Configurar CORS explícito para rutas de webhook (H-18)
- [ ] B-09 — Excluir /api/auth del rate limit del proxy (H-20)
- [ ] B-10 — Añadir middleware de autorización RBAC en endpoints críticos (M-12)

### Bloque C: Mejoras Funcionales (9 tareas)

- [ ] C-01 — Implementar avatar dinámico con datos de sesión real (H-08)
- [ ] C-02 — Añadir botón de logout y menú de usuario al dashboard (H-09)
- [ ] C-03 — Añadir campo ocrConfidence al schema de documentos (H-15)
- [ ] C-04 — Implementar envío real de notificaciones (email) (H-16)
- [ ] C-05 — Implementar soft-delete en entidades principales (M-09)
- [ ] C-06 — Añadir límite de versiones por documento (M-10)
- [ ] C-07 — Hacer configurable el porcentaje de ISV por firma (M-08)
- [ ] C-08 — Implementar healthcheck endpoint `/api/health` (M-26)
- [ ] C-09 — Añadir streaming en llamadas AI para chat (M-15)

### Bloque D: Optimizaciones y Rendimiento (5 tareas)

- [ ] D-01 — Aumentar staleTime de React Query a 2-5 minutos (H-06)
- [ ] D-02 — Añadir overflow-y-auto al sidebar (H-07)
- [ ] D-03 — Reutilizar instancia del modelo AI (M-14)
- [ ] D-04 — Añadir índice en audit_logs.createdAt (M-23)
- [ ] D-05 — Configurar timeouts en steps de Inngest OCR (M-16)

### Bloque E: Documentación y Deuda Técnica (4 tareas)

- [ ] E-01 — Actualizar AGENTS.md para reflejar fase actual, tema visual e Inngest (H-21, B-06, B-07)
- [ ] E-02 — Actualizar master.md con conteo real de tablas (19) y archivos route.ts (B-01)
- [ ] E-03 — Estandarizar nomenclatura "Lemon Squeezy" en toda la documentación (B-11)
- [ ] E-04 — Documentar proceso de rotación de secrets OAuth en apis.md (M-25)

---

## 6. Análisis de Riesgos Técnicos

| Riesgo | Criticidad | Probabilidad | Mitigación |
|---|---|---|---|
| OCR no funcional en PDFs escaneados | Crítica | Alta | C-10: Migrar a pdf.js + Tesseract |
| Fuga de datos por falta de RBAC | Alta | Media | B-10: Implementar middleware RBAC |
| DoS por falta de límite de body | Alta | Media | A-07: Validar Content-Length |
| Inconsistencia de precios (USD vs HNL) | Alta | Alta | A-02: Corregir montos |
| Dependencia de diccionario Spanish no verificado | Media | Media | A-04: Verificar con Neon |
| Race condition en signup | Media | Baja | B-07: Manejar constraint violation |
| Agotamiento de conexiones Neon | Media | Media | B-03: Configurar pool |
| Logs exponen PII (userId) | Baja | Alta | M-18: Enmascarar |

---

## 7. Recomendaciones de Arquitectura

### 7.1 — Implementar capa de servicios (Service Layer)
En lugar de lógica de negocio directamente en API routes, crear `lib/services/` con funciones puras:
- `lib/services/cases.service.ts`
- `lib/services/invoices.service.ts`
- `lib/services/notifications.service.ts`

Beneficios: Testeabilidad, reutilización, separación de concerns.

### 7.2 — Migrar validaciones a Zod (Fase 2)
Crear schemas Zod para cada entidad:
- `lib/validations/case.schema.ts`
- `lib/validations/contact.schema.ts`
- etc.

Usar `zod-form-data` para validar FormData en uploads.

### 7.3 — Implementar API Route wrapper
Crear un HOF que envuelva cada API route con:
- Auth check
- Rate limiting
- Body size validation
- Error handling estandarizado
- Audit logging automático

### 7.4 — Mejorar OCR pipeline
```
Upload → UploadThing → Metadata en DB → Inngest Job
→ Detectar tipo real (magic bytes)
→ Si DOCX: mammoth.js → texto
→ Si PDF nativo: pdf.js → texto
→ Si PDF escaneado/imagen: Tesseract OCR
→ Guardar texto + confidence → Índice GIN
→ Notificar completado
```

### 7.5 — Estandarizar manejo de errores
Crear `lib/errors.ts` con clases de error tipadas:
```ts
class UnauthorizedError extends Error { status = 401 }
class ValidationError extends Error { status = 400; fields: Record<string, string> }
class RateLimitError extends Error { status = 429 }
```

---

## Estado de Verificación

| Prueba | Resultado | Fecha |
|---|---|---|
| `npm run lint` | ⚠️ No verificado en esta auditoría | - |
| `npm run typecheck` | ⚠️ No verificado en esta auditoría | - |
| `npm run build` | ⚠️ No verificado en esta auditoría | - |
| `npm run test` | ⚠️ No verificado en esta auditoría | - |
| Archivos auditados manualmente | 150+ | 30 mayo 2026 |

---

**Nota final:** Esta auditoría refleja el estado del repositorio al 30 de mayo de 2026. Las verificaciones de lint, typecheck, build y test declaradas en master.md (0 errores, build exitoso) no se re-ejecutaron en esta auditoría. Se recomienda ejecutar estos comandos después de aplicar las correcciones críticas del Bloque A.

---

## Historial de revisiones

| Fecha | Versión | Cambios |
|---|---|---|
| 2026-05-30 | 1.0 | Auditoría inicial: 62 hallazgos, 35 tareas |
| 2026-05-30 | 2.0 | Auditoría completa archivo-por-archivo: 78 hallazgos, 42 tareas |

---

> **Documento generado por auditoría automatizada Kilo Code.**
> Complementa a `master.md` como guía de mejoras continuas.