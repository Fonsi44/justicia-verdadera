# Guía de Obtención de API Keys y Configuración

> Documento paso a paso para conseguir todas las credenciales necesarias del proyecto Justicia Verdadera. Cada sección incluye la URL exacta y el proceso detallado.

## Estado de verificación de servicios (2026-05-30)

| Servicio | Estado |
|---|---|
| Neon DB | ✅ Funcionando |
| GitHub OAuth | ⚠️ Configurado (pendiente verificar con navegador) |
| Google OAuth | ⚠️ Configurado (pendiente verificar con navegador) |
| DeepSeek | ✅ Funcionando |
| Upstash Redis | ✅ Funcionando |
| UploadThing | ❌ Token inválido — regenerar en dashboard |
| Resend | ✅ Funcionando |
| Stripe | ✅ Funcionando (modo test) |
| Inngest | ⚠️ Pendiente configurar |
| Vercel | ⚠️ Pendiente de despliegue |

---

## 0. Variables Base (sin API key)

Estas variables no requieren registro en ningún servicio externo:

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL de desarrollo local. En producción será `https://tudominio.com` |
| `NEXT_PUBLIC_APP_NAME` | `Justicia Verdadera` | Nombre de la aplicación |

---

## 1. Neon DB — Base de Datos PostgreSQL Serverless

> Neon proporciona PostgreSQL serverless con branching, ideal para desarrollo. Capa gratuita generosa: 0.5 GB de almacenamiento, 1 proyecto, 10 branches.

### Paso a paso

1. Ve a **https://neon.tech**
2. Haz clic en **"Sign Up"** (esquina superior derecha)
3. Regístrate con tu cuenta de **GitHub** o **Google** (recomendado GitHub)
4. Una vez dentro del dashboard, haz clic en **"Create project"**
5. Configura el proyecto:
   - **Name**: `justicia-verdadera`
   - **Postgres version**: Dejar la por defecto (la más reciente)
   - **Region**: Elige la más cercana a Honduras. Opciones:
     - `US East (Ohio)` — us-east-2 (menor latencia desde Centroamérica)
     - `US East (N. Virginia)` — us-east-1
   - Haz clic en **"Create project"**
6. Espera unos segundos a que se cree. Verás una pantalla con los datos de conexión.
7. En la sección **"Connection Details"**, selecciona **"Prisma"** como framework (es compatible con Drizzle)
8. **Copia la connection string** completa. Tendrá este formato:
   ```
   postgresql://neondb_owner:xxxxxxxxxxxx@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
9. Pega ese valor en tu `.env.local`:
   ```
   DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Probar la conexión

```bash
cd app
npx drizzle-kit push
```

Si ves `[✓] Changes applied`, la conexión funciona y las 17 tablas se han creado en Neon.

> **Nota técnica**: El `drizzle.config.ts` ya incluye `import { config } from "dotenv"; config({ path: ".env.local" })` para cargar automáticamente las variables de entorno. Si cambias el archivo `.env.local`, recuerda que Drizzle Kit lo recarga en cada ejecución.

### Panel de Neon

- Dashboard: **https://console.neon.tech**
- Aquí puedes ver tablas, ejecutar SQL, crear branches, y monitorizar uso.

### Límites capa gratuita

- 0.5 GB de datos
- 1 proyecto
- 10 branches
- 100 horas de compute al mes
- Suficiente para desarrollo y MVP

---

## 2. NextAuth.js — Autenticación

### 2.1 AUTH_SECRET

Se genera localmente, no requiere registro externo:

```bash
# En PowerShell, ejecuta:
npx auth secret
```

O manualmente:

```bash
# Genera un string aleatorio de 64 caracteres
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado en:
```
AUTH_SECRET=el_valor_generado
```

### 2.2 GitHub OAuth App

Permite a los usuarios iniciar sesión con su cuenta de GitHub.

1. Ve a **https://github.com/settings/developers**
2. Haz clic en **"New OAuth App"** (NO en "New GitHub App")
3. Rellena el formulario:
   - **Application name**: `Justicia Verdadera (dev)`
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: `Plataforma de gestión legal con IA para despachos de abogados en Honduras`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Haz clic en **"Register application"**
5. En la siguiente pantalla verás:
   - **Client ID** → copia este valor
   - **Client Secrets** → haz clic en **"Generate a new client secret"** y copia el valor
6. Pega en `.env.local`:
   ```
   AUTH_GITHUB_ID=tu_client_id
   AUTH_GITHUB_SECRET=tu_client_secret
   ```

**Nota para producción**: Cuando tengas dominio real, crea OTRA OAuth App con la URL de producción y el callback correspondiente. No reutilices la de desarrollo.

### Crear app de producción (cuando tengas dominio)

1. Repite los pasos anteriores
2. Cambia:
   - **Homepage URL**: `https://tudominio.com`
   - **Callback URL**: `https://tudominio.com/api/auth/callback/github`
3. Usa estas credenciales en el deploy de Vercel (no en `.env.local`)

### 2.3 Google OAuth

Permite iniciar sesión con cuenta de Google.

1. Ve a **https://console.cloud.google.com**
2. Si no tienes proyecto, crea uno:
   - Haz clic en el selector de proyecto (barra superior)
   - **"New Project"**
   - Nombre: `justicia-verdadera`
   - Haz clic en **"Create"**
3. Una vez en el proyecto, ve al menú lateral → **"APIs & Services"** → **"OAuth consent screen"**
4. Configura la pantalla de consentimiento:
   - **User Type**: `External`
   - Haz clic en **"Create"**
   - **App name**: `Justicia Verdadera`
   - **User support email**: tu email
   - **Developer contact information**: tu email
   - **Scopes**: no añadas ninguno (basta con email y profile por defecto)
   - **Test users**: añade tu email
   - Haz clic en **"Save and Continue"** hasta finalizar
5. Ahora ve a **"APIs & Services"** → **"Credentials"**
6. Haz clic en **"Create Credentials"** → **"OAuth client ID"**
7. Configura:
   - **Application type**: `Web application`
   - **Name**: `Justicia Verdadera (dev)`
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
8. Haz clic en **"Create"**
9. Aparecerá una ventana con:
   - **Client ID** → copia
   - **Client Secret** → copia
10. Pega en `.env.local`:
    ```
    AUTH_GOOGLE_ID=tu_client_id.apps.googleusercontent.com
    AUTH_GOOGLE_SECRET=tu_client_secret
    ```

### Google OAuth para producción

1. Ve al mismo proyecto en Google Cloud Console
2. Crea OTRO "OAuth client ID" con:
   - **Authorized JavaScript origins**: `https://tudominio.com`
   - **Authorized redirect URIs**: `https://tudominio.com/api/auth/callback/google`
3. Publica la app: **"OAuth consent screen"** → **"Publish App"**

---

## 3. DeepSeek V4 Flash — Inteligencia Artificial

> DeepSeek es el proveedor de LLM que usamos para todas las funcionalidades de IA jurídica. Es más económico que OpenAI y Anthropic.

1. Ve a **https://platform.deepseek.com**
2. Haz clic en **"Sign Up"** (esquina superior derecha)
3. Regístrate con email o GitHub
4. Una vez dentro, ve a **https://platform.deepseek.com/api_keys**
5. Haz clic en **"Create new API key"**
6. Ponle nombre: `justicia-verdadera-dev`
7. **Copia la key inmediatamente** (solo se muestra una vez)
8. Pega en `.env.local`:
   ```
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Recargar saldo

- Ve a **https://platform.deepseek.com/top_up**
- Añade saldo (mínimo recomendado: $5 USD para desarrollo)
- Precios (mayo 2026):
  - DeepSeek V4 Flash: ~$0.14 / 1M tokens input, ~$0.55 / 1M tokens output
  - Muy competitivo frente a OpenAI GPT-4o (~$2.50 / 1M input)

### Dashboard de uso

- **https://platform.deepseek.com/usage** — consumo en tiempo real
- **https://platform.deepseek.com/api_keys** — gestionar keys

---

## 4. Upstash Redis — Cache y Rate Limiting

> Redis serverless con capa gratuita generosa. Lo usamos para sesiones, rate limiting, y colas de trabajo.

1. Ve a **https://console.upstash.com**
2. Haz clic en **"Sign Up"** → Regístrate con GitHub o Google
3. Una vez en el dashboard, haz clic en **"Create Database"**
4. Configura:
   - **Name**: `justicia-verdadera`
   - **Type**: `Regional`
   - **Region**: `us-east-1` (la más cercana a Honduras)
   - **TLS**: Activado (por defecto)
5. Haz clic en **"Create"**
6. Una vez creada, ve a la pestaña **"Details"**
7. Desplázate a la sección **"REST API"** (NO uses Redis CLI/TCP)
8. Verás dos valores:
   - **UPSTASH_REDIS_REST_URL** → copia el endpoint completo
   - **UPSTASH_REDIS_REST_TOKEN** → copia el token
9. Pega en `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

### Capa gratuita

- 10,000 comandos/día
- 256 MB de almacenamiento
- Suficiente para desarrollo y MVP inicial

### Dashboard

- **https://console.upstash.com** — monitorizar uso, métricas

---

## 5. UploadThing — Subida de Archivos

> Servicio de subida de archivos optimizado para Next.js. Lo usamos para documentos legales (PDFs, DOCX, imágenes).

1. Ve a **https://uploadthing.com**
2. Haz clic en **"Get Started"** o **"Sign In"**
3. Regístrate con GitHub
4. Una vez en el dashboard, haz clic en **"Create a new app"**
5. Nombre: `justicia-verdadera`
6. Una vez creada, ve a la pestaña **"API Keys"**
7. Copia el **Secret Key** (NO el token JWT largo):
   - El valor correcto empieza por `sk_live_...`
   - Si ves un token muy largo tipo `eyJhcGl...`, desplázate más abajo y busca la **Secret Key**
8. Pega en `.env.local`:
   ```
   UPLOADTHING_TOKEN=sk_live_xxxxxxxxxxxxxxxxxxxx
   ```
9. **Importante**: no envuelvas el valor entre comillas. En archivos `.env` los valores van sin comillas.

### Capa gratuita

- 2 GB de almacenamiento
- 2 GB de ancho de banda mensual
- Suficiente para desarrollo

### Dashboard

- **https://uploadthing.com/dashboard** — ver archivos, gestionar storage

---

## 6. Resend — Envío de Emails Transaccionales

> API moderna de email para enviar correos de bienvenida, notificaciones, facturas, recordatorios.

1. Ve a **https://resend.com**
2. Haz clic en **"Sign Up"**
3. Regístrate con GitHub o Google
4. Una vez en el dashboard, ve a **"API Keys"** en el menú lateral
5. Haz clic en **"Create API Key"**
6. Nombre: `justicia-verdadera-dev`
7. **Permission**: `Sending access` (por defecto)
8. Haz clic en **"Create"**
9. **Copia la key** (solo se muestra una vez)
10. Pega en `.env.local`:
    ```
    RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
    ```

### Configurar dominio de envío (necesario para producción)

Para desarrollo, Resend permite enviar emails desde `onboarding@resend.dev` a tu propio email verificado. Para producción necesitas un dominio verificado:

1. Ve a **https://resend.com/domains**
2. Haz clic en **"Add Domain"**
3. Introduce tu dominio (ej: `justiciaverdadera.com`)
4. Sigue las instrucciones para añadir registros DNS (MX, TXT, DKIM)
5. Una vez verificado, podrás enviar desde `cualquiercosa@tudominio.com`

### Email para desarrollo

En desarrollo, pon:
```
RESEND_FROM_EMAIL=Justicia Verdadera <onboarding@resend.dev>
```

Resend solo enviará emails a direcciones verificadas en modo testing. Para verificar tu email:

1. Ve a **https://resend.com/api-keys**
2. Busca tu API key y haz clic en el icono de ojo
3. En la sección "Testing", añade tu dirección de email personal
4. Recibirás un email de verificación → confírmalo

### Capa gratuita

- 100 emails/día
- 3,000 emails/mes
- Dominio compartido `resend.dev`
- Suficiente para desarrollo

---

## 7. Stripe — Pagos y Suscripciones

> Procesador de pagos para las suscripciones SaaS. Solo necesitas modo test para desarrollo.

1. Ve a **https://dashboard.stripe.com/register**
2. Regístrate con email
3. **IMPORTANTE**: Una vez registrado, asegúrate de estar en **modo test**
   - En la barra lateral izquierda, verás un toggle "View test data" / "View live data"
   - Activa **"View test data"** (debe aparecer un banner amarillo "Test mode")
4. En el menú lateral, ve a **"Developers"** → **"API keys"**
5. Copia:
   - **Publishable key** (empieza por `pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (empieza por `sk_test_...`) → `STRIPE_SECRET_KEY`
6. Pega en `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   ```

### Crear productos y precios

1. Ve a **https://dashboard.stripe.com/test/products**
2. Haz clic en **"Add product"**
3. Crea 3 productos (uno por plan):

   **Plan Starter:**
   - Name: `Justicia Verdadera — Starter`
   - Description: `1 usuario, 20 casos activos, 10 prompts IA/mes`
   - Price: `$29.00 USD` — Recurring → Monthly
   - Guarda el **Price ID** (ej: `price_...`)

   **Plan Profesional:**
   - Name: `Justicia Verdadera — Profesional`
   - Description: `3 usuarios, 100 casos activos, 50 prompts IA/mes`
   - Price: `$79.00 USD` — Recurring → Monthly

   **Plan Despacho:**
   - Name: `Justicia Verdadera — Despacho`
   - Description: `10 usuarios, casos ilimitados, 200 prompts IA/mes`
   - Price: `$199.00 USD` — Recurring → Monthly

4. Los Price IDs se usarán más adelante en el código.

### Documentación relevante

- Dashboard test: **https://dashboard.stripe.com/test**
- API keys: **https://dashboard.stripe.com/test/apikeys**
- Productos: **https://dashboard.stripe.com/test/products**
- Webhooks: **https://dashboard.stripe.com/test/webhooks**
- Documentación: **https://docs.stripe.com**

---

## 8. Vercel — Hosting y Deploy

> Para producción. No necesario para desarrollo local.

1. Ve a **https://vercel.com/signup**
2. Regístrate con GitHub (obligatorio para integración con repositorio)
3. Una vez dentro, haz clic en **"Import Project"**
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Framework**: Next.js (detectado automáticamente)
   - **Root Directory**: `app`
   - **Build Command**: `npx drizzle-kit push && next build`
   - **Output Directory**: `.next`
6. En **"Environment Variables"**, pega TODAS las variables de `.env.local` (excepto las de desarrollo local)
7. Haz clic en **"Deploy"**

### Dominio

- Vercel proporciona un subdominio gratuito: `justicia-verdadera.vercel.app`
- Para dominio personalizado: **Settings** → **Domains** → añade tu dominio y configura los DNS

### Dashboard

- **https://vercel.com/dashboard**

---

## 9. Inngest — Workflows Asíncronos

> Orquestador de funciones durables con reintentos y scheduling.

1. Ve a **https://app.inngest.com/sign-up**
2. Regístrate con GitHub o email
3. Una vez dentro, haz clic en **"Create Event Key"**
4. Configura:
   - **Name**: `justicia-verdadera-dev`
   - **Environment**: `Development`
5. Copia la **Event Key**
6. Pega en `.env.local`:
   ```
   INNGEST_EVENT_KEY=ingest_xxxxxxxxxxxxxxxxxxxx
   ```

### Capa gratuita

- 1,000,000 de steps/mes
- 3 funciones/workflows
- Cola de eventos incluida

### Dashboard

- **https://app.inngest.com** — monitorizar ejecuciones, reintentos, logs

---

## Resumen Rápido — Checklist de Registro

Marca cada servicio conforme lo configures:

```
[ ] 1. Neon DB          → https://neon.tech               → DATABASE_URL
[ ] 2. GitHub OAuth     → https://github.com/settings/developers → AUTH_GITHUB_ID + SECRET
[ ] 3. Google OAuth     → https://console.cloud.google.com → AUTH_GOOGLE_ID + SECRET
[ ] 4. AUTH_SECRET      → Local (npx auth secret o crypto) → AUTH_SECRET
[ ] 5. DeepSeek         → https://platform.deepseek.com    → DEEPSEEK_API_KEY
[ ] 6. Upstash Redis    → https://console.upstash.com      → UPSTASH_REDIS_REST_URL + TOKEN
[ ] 7. UploadThing      → https://uploadthing.com          → UPLOADTHING_TOKEN
[ ] 8. Resend           → https://resend.com               → RESEND_API_KEY + FROM_EMAIL
[ ] 9. Stripe           → https://dashboard.stripe.com     → STRIPE_SECRET_KEY + PUBLISHABLE_KEY
[ ] 10. Inngest         → https://app.inngest.com          → INNGEST_EVENT_KEY
[ ] 11. Vercel (prod)   → https://vercel.com               → Reemplazar variables con valores de producción
```

---

## Orden recomendado de configuración

Configura los servicios en este orden para ir desbloqueando funcionalidad progresivamente:

1. **Neon DB** — necesario para que la app funcione (persistencia)
2. **AUTH_SECRET** — se genera local, 1 minuto
3. **GitHub OAuth** — permite hacer login en desarrollo (más fácil que Google)
4. **DeepSeek** — desbloquea todas las features de IA
5. **Google OAuth** — segunda opción de login para usuarios
6. **Upstash Redis** — rate limiting y cache
7. **UploadThing** — subida de archivos y documentos
8. **Resend** — envío de emails (bienvenida, notificaciones, facturas)
9. **Stripe** — pagos y suscripciones
10. **Inngest** — workflows automatizados (onboarding, recordatorios)
11. **Vercel** — deploy a producción
