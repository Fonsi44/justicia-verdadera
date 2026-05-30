# Guía de Obtención de API Keys y Configuración

> Documento paso a paso para conseguir todas las credenciales necesarias del proyecto Justicia Verdadera. Cada sección incluye la URL exacta y el proceso detallado.

## Estado de verificación de servicios (2026-05-30)

| Servicio | Estado |
|---|---|
| Neon DB | ✅ Funcionando |
| Google OAuth | ✅ Funcionando |
| Microsoft Entra ID OAuth | ⚠️ Pendiente configurar en Azure Portal |
| DeepSeek | ✅ Funcionando |
| Upstash Redis | ✅ Funcionando |
| UploadThing | ✅ Token renovado |
| Resend | ✅ Funcionando |
| Stripe | ⚠️ Archivado — reemplazado por Lemon Squeezy |
| Lemon Squeezy | ✅ Verificado — Pendiente crear productos en dashboard |
| Inngest | ✅ Verificado (pospuesto a Fase 2) |
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

### 2.2 Google OAuth

Permite iniciar sesión con cuenta de Google. Es el método de login principal para los abogados (practicamente todos tienen Gmail).

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

### 2.3 Microsoft Entra ID OAuth (Azure AD)

Permite iniciar sesión con cuenta de Microsoft (Outlook, Office 365, Hotmail). Muchos despachos de abogados usan Office 365/Outlook como correo corporativo, por lo que este método es muy relevante para el público objetivo.

1. Ve a **https://portal.azure.com**
2. Busca **"Microsoft Entra ID"** en la barra de búsqueda superior (antes llamado Azure Active Directory)
3. En el menú lateral, ve a **"App registrations"** → **"New registration"**
4. Configura:
   - **Name**: `Justicia Verdadera (dev)`
   - **Supported account types**: `Accounts in any organizational directory and personal Microsoft accounts`
   - **Redirect URI**: `Web` → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Haz clic en **"Register"**
6. Una vez creada, anota:
   - **Application (client) ID** → `AUTH_MICROSOFT_ENTRA_ID_ID`
7. Ve a **"Certificates & secrets"** → **"New client secret"**
   - **Description**: `dev`
   - **Expires**: `24 months`
8. Haz clic en **"Add"** y copia el **Value** (solo se muestra una vez)
   - **Client secret value** → `AUTH_MICROSOFT_ENTRA_ID_SECRET`
9. Pega en `.env.local`:
   ```
   AUTH_MICROSOFT_ENTRA_ID_ID=tu_application_client_id
   AUTH_MICROSOFT_ENTRA_ID_SECRET=tu_client_secret
   ```

**Nota**: Por defecto, el issuer usa `https://login.microsoftonline.com/common/v2.0` que permite cualquier cuenta Microsoft (personal, trabajo, educativa). Si quieres restringir el acceso solo a una organizacion, añade:
```
AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<ID_del_inquilino>/v2.0
```

### Microsoft Entra ID para producción

1. Ve al mismo "App registration" en Azure Portal
2. Añade otro Redirect URI: `https://tudominio.com/api/auth/callback/microsoft-entra-id`
3. Crea un nuevo client secret para produccion

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

> Servicio de subida de archivos optimizado para Next.js. Lo usamos para documentos legales (PDFs, DOCX, imágenes). El token ha sido renovado y verificado.

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

## 7. Lemon Squeezy — Pagos y Suscripciones (Merchant of Record)

> **Lemon Squeezy** actúa como **Merchant of Record (MoR)**. Esto significa que ellos procesan los pagos, gestionan impuestos globales (VAT, IVA, sales tax), emiten facturas y asumen la responsabilidad fiscal. Perfecto para proyectos en Honduras, ya que no necesitas estar en un país soportado por Stripe.

### ¿Por qué Lemon Squeezy y no Stripe?

| Razón | Detalle |
|---|---|
| Honduras no soportado por Stripe | Stripe no permite cuentas de empresas registradas en Honduras. Lemon Squeezy sí. |
| Merchant of Record | Lemon Squeezy gestiona impuestos, facturación y compliance global. Tú solo recibes el pago neto. |
| Checkout listo | Checkout page hosted, sin implementar desde cero. |
| Webhooks y API | API REST y webhooks para integrar suscripciones. |
| Coste | ~5% + $0.50 por transacción. Sin costes mensuales fijos. |

### Paso a paso

1. Ve a **https://lemonsqueezy.com**
2. Haz clic en **"Get Started"** (esquina superior derecha)
3. Regístrate con tu email o GitHub
4. Una vez dentro del dashboard, ve a **"Settings"** → **"Store"**
5. Configura tu tienda:
   - **Store name**: `Justicia Verdadera`
   - **Currency**: `USD`
   - **Locale**: `es`
6. Ve a **"Products"** → **"Create your first product"**
7. Crea 3 productos (uno por plan):

   **Plan Starter:**
   - **Name**: `Justicia Verdadera — Starter`
   - **Description**: `1 usuario, 20 casos activos, 10 prompts IA/mes`
   - **Price**: `$29.00 USD` — Recurring → Monthly
   - **Variant name**: `Mensual`

   **Plan Profesional:**
   - **Name**: `Justicia Verdadera — Profesional`
   - **Description**: `3 usuarios, 100 casos activos, 50 prompts IA/mes`
   - **Price**: `$79.00 USD` — Recurring → Monthly

   **Plan Despacho:**
   - **Name**: `Justicia Verdadera — Despacho`
   - **Description**: `10 usuarios, casos ilimitados, 200 prompts IA/mes`
   - **Price**: `$199.00 USD` — Recurring → Monthly

8. Guarda los **Product ID** y **Variant ID** de cada plan (los necesitarás en el código).

### Obtener API Key

1. Ve a **"Settings"** → **"API"**
2. Haz clic en **"Generate API key"**
3. Dale nombre: `justicia-verdadera-dev`
4. Copia la key. Pega en `.env.local`:
   ```
   LEMON_SQUEEZY_API_KEY=tu_api_key
   ```

### Configurar Webhooks (para desarrollo)

1. Ve a **"Settings"** → **"Webhooks"**
2. Haz clic en **"Create webhook"**
3. Configura:
   - **URL**: `http://localhost:3000/api/webhooks/lemon-squeezy`
   - **Events**: selecciona `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`
4. Copia el **Signing Secret**. Pega en `.env.local`:
   ```
   LEMON_SQUEEZY_WEBHOOK_SECRET=tu_signing_secret
   ```

### Integración técnica

```bash
# Instalar SDK opcional (si decides usarlo)
npm install @lemonsqueezy/lemonsqueezy.js
```

> **Nota**: La integración de Lemon Squeezy está planificada para implementarse cuando se active el checkout comercial. Durante Fase 1.5 no hay checkout automático.

### Verificación técnica (30 mayo 2026)

```bash
node scripts/verify-lemon-squeezy.js
```

| Aspecto | Estado |
|---|---|
| Tienda creada | ✅ JUSTICIA VERDADERA (Store ID: 391910) |
| País | ✅ Honduras (HN) |
| Conexión API | ✅ API Key funciona correctamente |
| Webhook configurado | ✅ URL, secret y eventos activados |
| Planes de suscripción (3) | ⚠️ Pendiente crear en dashboard |
| Checkout comercial | ⚠️ Pendiente (Fase 2) |

Los planes de suscripción NO pueden crearse por API. Debes crearlos manualmente:

```bash
# Abre el dashboard para crear productos:
node scripts/setup-lemon-squeezy.js
```

O directamente: **https://app.lemonsqueezy.com/products**

### Product IDs

Después de crear los productos, guarda los IDs en `.env.local`:

```env
STORE_ID=391910
LS_PRODUCT_STARTER_ID=
LS_PRODUCT_PROFESIONAL_ID=
LS_PRODUCT_DESPACHO_ID=
LS_VARIANT_STARTER_ID=
LS_VARIANT_PROFESIONAL_ID=
LS_VARIANT_DESPACHO_ID=
```

### Panel de Lemon Squeezy

- Dashboard: **https://app.lemonsqueezy.com**
- Productos: **https://app.lemonsqueezy.com/products**
- API keys: **https://app.lemonsqueezy.com/settings/api**
- Webhooks: **https://app.lemonsqueezy.com/settings/webhooks**

### Documentación

- **https://docs.lemonsqueezy.com**

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

> Orquestador de funciones durables con reintentos y scheduling. El servicio ya está configurado y verificado. Se pospone su uso activo a Fase 2 (automatizaciones), usando Cron Jobs de Vercel para tareas programadas simples durante el MVP.

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
[ ] 2. AUTH_SECRET      → Local (npx auth secret o crypto) → AUTH_SECRET
[ ] 3. Google OAuth     → https://console.cloud.google.com → AUTH_GOOGLE_ID + SECRET
[ ] 4. Microsoft Entra ID → https://portal.azure.org       → AUTH_MICROSOFT_ENTRA_ID_ID + SECRET
[ ] 5. DeepSeek         → https://platform.deepseek.com    → DEEPSEEK_API_KEY
[ ] 6. Upstash Redis    → https://console.upstash.com      → UPSTASH_REDIS_REST_URL + TOKEN
[ ] 7. UploadThing      → https://uploadthing.com          → UPLOADTHING_TOKEN
[ ] 8. Resend           → https://resend.com               → RESEND_API_KEY + FROM_EMAIL
[ ] 9. Lemon Squeezy    → https://lemonsqueezy.com         → LEMON_SQUEEZY_API_KEY
[ ] 10. Inngest         → https://app.inngest.com          → INNGEST_EVENT_KEY
[ ] 11. Vercel (prod)   → https://vercel.com               → Reemplazar variables con valores de producción
```

## Orden recomendado de configuración

Configura los servicios en este orden para ir desbloqueando funcionalidad progresivamente:

1. **Neon DB** — necesario para que la app funcione (persistencia)
2. **AUTH_SECRET** — se genera local, 1 minuto
3. **Google OAuth** — principal método de login para abogados
4. **Microsoft Entra ID** — segunda opción de login (muchos despachos usan Office 365)
5. **DeepSeek** — desbloquea todas las features de IA
6. **Upstash Redis** — rate limiting y cache
7. **UploadThing** — subida de archivos y documentos
8. **Resend** — envío de emails (bienvenida, notificaciones, facturas)
9. **Lemon Squeezy** — pasarela de pagos MoR (apta para Honduras)
10. **Inngest** — workflows automatizados (pospuesto a Fase 2)
11. **Vercel** — deploy a producción
