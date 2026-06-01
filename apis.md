# Guía de Obtención de API Keys y Configuración

> Documento paso a paso para conseguir todas las credenciales necesarias del proyecto Justicia Verdadera. Cada sección incluye la URL exacta y el proceso detallado.
>
> **Convención:** Toda integración mencionada en `master.md` tiene su explicación detallada de implementación en este documento.

## Estado de verificación de servicios (1 junio 2026)

| Servicio | Estado | Uso |
|---|---|---|
| Neon DB | ✅ Activo | Base de datos PostgreSQL |
| Google OAuth | ✅ Activo | Login de abogados con cuenta Google |
| Microsoft Entra ID OAuth | ✅ Activo | Login con cuenta Microsoft / Office 365 |
| DeepSeek V4 Flash | ✅ Activo | IA jurídica, chat RAG, generación de borradores |
| Upstash Redis | ✅ Activo | Caché, rate limiting, sesiones |
| UploadThing | ✅ Activo | Subida de documentos legales |
| Resend | ✅ Activo | Emails transaccionales (bienvenida, facturas, notificaciones) |
| Lemon Squeezy | ✅ Activo — Pendiente crear productos | Pasarela de pagos MoR (suscripciones SaaS) |
| Inngest | ✅ Activo | Workflows asíncronos (OCR documental) |
| Vercel | ⚠️ Pendiente de despliegue | Hosting producción |
| Google Calendar API | ⚠️ Planificado — Fase 2bis | Sincronización agenda con Google Calendar |
| Microsoft Graph API | ⚠️ Planificado — Fase 2bis | Sincronización agenda con Outlook |
| WhatsApp Business Cloud | ⚠️ Planificado — Fase 2bis | Notificaciones a clientes vía WhatsApp |
| Firma Electrónica SAR (FEA) | ⚠️ Planificado — Fase 2bis | Firma digital de documentos con validez legal HN |
| SAR Oficina Virtual | ⚠️ Planificado — Fase 2bis | Declaraciones ISV/ISR, gestión CAI, libros contables |
| pgvector (Neon) | ✅ Activo | Búsqueda semántica en corpus legal |
| Validación RTN | ⚠️ Planificado — Fase 2bis | Verificar RTN de clientes contra SAR |
| Reportes SAR | ⚠️ Planificado — Fase 2bis | Libro de ventas ISV, reporte mensual, calendario fiscal |

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

### Solicitar permisos de calendario en el login (sin segundo OAuth)

Justicia Verdadera ya está configurado para pedir acceso al calendario de Google durante el login inicial. Los scopes están incluidos en `lib/auth/index.ts`:

```typescript
Google({
  authorization: {
    params: {
      scope: "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
      access_type: "offline",  // Necesario para obtener refresh_token
      prompt: "consent",       // Fuerza pantalla de consentimiento cada vez
    },
  },
})
```

**Lo que ve el abogado:**
1. Inicia sesión con Google por primera vez
2. Google muestra: *"Justicia Verdadera quiere acceder a tu información básica Y gestionar tus calendarios"*
3. Acepta una sola vez → todos los permisos concedidos
4. El sistema guarda automáticamente `access_token` y `refresh_token` en la sesión JWT
5. Los eventos de la agenda de Justicia Verdadera se sincronizan con Google Calendar automáticamente

**No se necesita un segundo flujo OAuth separado para el calendario.**

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

### Solicitar permisos de calendario + correo en el login (sin segundo OAuth)

Igual que con Google, Justicia Verdadera pide todos los permisos durante el login inicial. Los scopes están configurados en `lib/auth/index.ts`:

```typescript
MicrosoftEntraID({
  authorization: {
    params: {
      scope: "openid email profile offline_access Calendars.ReadWrite Mail.Read",
    },
  },
})
```

**Scopes incluidos:**
- `Calendars.ReadWrite` — Sincronizar citas, vistas, audiencias con Outlook
- `Mail.Read` — Leer correos (futuro: auto-archivar en expedientes)
- `offline_access` — Obtener refresh_token para acceso permanente

**Lo que ve el abogado:**
1. Inicia sesión con Microsoft por primera vez
2. Microsoft muestra: *"Justicia Verdadera necesita: Ver tu perfil, Leer y escribir en tus calendarios, Leer tu correo"*
3. Acepta una sola vez → todos los permisos concedidos
4. El sistema guarda tokens en sesión JWT para sincronización automática

**No se necesita un segundo flujo OAuth separado para Outlook Calendar.**

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
   - **Currency**: `HNL`
   - **Locale**: `es`
6. Ve a **"Products"** → **"Create your first product"**
7. Crea 3 productos (uno por plan):

   **Plan Starter:**
   - **Name**: `Justicia Verdadera — Starter`
   - **Description**: `1 usuario, 20 casos activos, 10 prompts IA/mes`
   - **Price**: `750.00 HNL` — Recurring → Monthly
   - **Variant name**: `Mensual`

   **Plan Profesional:**
   - **Name**: `Justicia Verdadera — Profesional`
   - **Description**: `3 usuarios, 100 casos activos, 50 prompts IA/mes`
   - **Price**: `2,050.00 HNL` — Recurring → Monthly

   **Plan Despacho:**
   - **Name**: `Justicia Verdadera — Despacho`
   - **Description**: `10 usuarios, 500 casos activos, 200 prompts IA/mes`
   - **Price**: `5,150.00 HNL` — Recurring → Monthly

8. Guarda los **Product ID** y **Variant ID** de cada plan (los necesitarás en el código).

### Precio por uso (overage)

Los prompts que excedan el límite del plan se cobran aparte:
- **L. 5.00 por prompt extra** (~$0.50 USD).
- Se facturan al final del ciclo mensual automáticamente.
- El despacho configura un límite de gasto máximo mensual.
- No requiere producto separado en Lemon Squeezy — se gestiona vía webhook y lógica interna.

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

## 8. Vercel — Hosting, Deploy y GitHub Actions Secrets

> Para producción y CI/CD. El proyecto `justicia-verdadera` ya existe en Vercel (cuenta `Fonsi44`). Todos los secrets de GitHub Actions han sido configurados automáticamente con los valores reales del proyecto.

### Estado actual (30 mayo 2026)

| Aspecto | Estado | Valor |
|---|---|---|
| Cuenta Vercel | ✅ `fonsi44` | Plan Hobby |
| Proyecto | ✅ Creado | `justicia-verdadera` |
| Root Directory | ✅ Configurado | `app` |
| Build Command | ✅ Configurado | `npx drizzle-kit push && next build` |
| Output Directory | ✅ Configurado | `.next` |
| Install Command | ✅ Configurado | `npm install` |
| Git Repository | ✅ Conectado | `Fonsi44/justicia-verdadera` |
| GitHub Secrets (3) | ✅ Configurados | VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID |

### 8.1 Primer deploy desde dashboard web

1. Ve a **https://vercel.com/Fonsi44/justicia-verdadera**
2. Haz clic en **"Connect Git Repository"**
3. Selecciona el repo **`Fonsi44/justicia-verdadera`**
4. Verifica que la configuración se haya precargado correctamente:
   - **Root Directory**: `app`
   - **Build Command**: `npx drizzle-kit push && next build`
   - **Output Directory**: `.next`
5. Añade las variables de entorno de producción en **Environment Variables** — necesitas añadir las mismas que en `.env.example` pero con valores reales de producción. Las críticas son:
   - `DATABASE_URL` — URL de Neon DB en producción
   - `AUTH_SECRET` — nuevo secret de producción
   - `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`
   - `DEEPSEEK_API_KEY`
   - `UPLOADTHING_TOKEN`
   - `RESEND_API_KEY`
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
6. Haz clic en **"Deploy"**

### 8.2 GitHub Actions Secrets (ya configurados)

Los 3 secrets necesarios para el workflow `preview.yml` ya han sido creados automáticamente en GitHub:

| Secret | Valor | Estado |
|---|---|---|
| `VERCEL_TOKEN` | `vcp_4bac...` (token de acceso total) | ✅ Configurado |
| `VERCEL_ORG_ID` | `team_VbJlXKlK5jE8fMWx0k7onqpk` | ✅ Configurado |
| `VERCEL_PROJECT_ID` | `prj_bfw2rfqDLnQntKVOkYFlMQJfy5MM` | ✅ Configurado |

**No necesitas hacer nada más.** Los workflows `ci.yml` y `preview.yml` ya están en `.github/workflows/` con la configuración correcta.

> ⚠️ Si alguna vez necesitas regenerar el token, los pasos detallados están a continuación.

### 8.3 Cómo regenerar los secrets manualmente (solo si es necesario)

#### VERCEL_TOKEN

1. Ve a **https://vercel.com/account/tokens**
2. Haz clic en **"Create Token"**
3. Nombre: `github-actions-ci`
4. Scope: `Full Account`
5. Expiration: `No Expiration`
6. Haz clic en **"Create"**
7. **Copia el token** y actualízalo en GitHub Secrets

#### VERCEL_ORG_ID

```bash
vercel api /v2/user --token=TU_TOKEN
# Busca "user.id" en la respuesta
```

O desde el dashboard: **https://vercel.com/Fonsi44/justicia-verdadera/settings**

#### VERCEL_PROJECT_ID

```bash
vercel api /v9/projects/justicia-verdadera --token=TU_TOKEN
# Busca "id" en la respuesta
```

### Resumen rápido

```bash
npm install -g vercel
vercel login

# 2. Login (abre navegador)
vercel login

# 3. Vincular proyecto (después del primer deploy manual)
cd app
vercel link

# 4. Ver IDs
cat .vercel/project.json
# → projectId = VERCEL_PROJECT_ID
# → orgId    = VERCEL_ORG_ID

# 5. Crear token en https://vercel.com/account/tokens
# 6. Añadir los 3 secrets en GitHub.com
```

### Nota sobre este proyecto

El proyecto `justicia-verdadera` ya existe en Vercel (cuenta `Fonsi44`) pero **nunca se ha desplegado**. Si ejecutas `vercel link` localmente tras autenticarte, debería detectar el proyecto existente automáticamente.

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

## 10. Google Calendar API — Sincronización de Calendario

> Sincronización bidireccional entre la agenda de Justicia Verdadera y Google Calendar del abogado. Audiencias, vistas, plazos y reuniones aparecen automáticamente en su calendario personal.

> ⚡ **Importante**: Los permisos de calendario YA se solicitan en el login inicial (sección 2.2). El abogado no necesita autorizar una segunda vez. Los tokens `access_token` y `refresh_token` se almacenan automáticamente en la sesión JWT y están disponibles vía `session.calendarAccess`.

### Habilitar la API

1. Ve a **https://console.cloud.google.com**
2. Selecciona el mismo proyecto que creaste para Google OAuth (`justicia-verdadera`)
3. Ve al menú lateral → **"APIs & Services"** → **"Library"**
4. Busca **"Google Calendar API"** y haz clic en **"Enable"**
5. Una vez habilitada, ve a **"APIs & Services"** → **"Credentials"**
6. Haz clic en **"Create Credentials"** → **"OAuth client ID"**
7. Configura (o usa el mismo que Google OAuth si quieres unificar):
   - **Application type**: `Web application`
   - **Name**: `Justicia Verdadera Calendar (dev)`
   - **Authorized redirect URIs**: añade `http://localhost:3000/api/integrations/google-calendar/callback`
8. Haz clic en **"Create"**
9. Anota:
   - **Client ID** → `GOOGLE_CALENDAR_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CALENDAR_CLIENT_SECRET`
10. Pega en `.env.local`:
    ```
    GOOGLE_CALENDAR_CLIENT_ID=tu_client_id.apps.googleusercontent.com
    GOOGLE_CALENDAR_CLIENT_SECRET=tu_client_secret
    ```

### Scopes necesarios

Durante la autorización OAuth, solicita estos scopes:
- `https://www.googleapis.com/auth/calendar.events` — Leer/crear eventos
- `https://www.googleapis.com/auth/calendar.readonly` — Solo lectura (modo seguro)

### Flujo de integración

```text
Abogado conecta cuenta Google → OAuth consent (scopes calendar)
→ Guardar refresh_token en users.google_calendar_token
→ Crear eventos en Google Calendar al crear evento en JV
→ Webhook de Google notifica cambios en Calendar → reflejar en JV
```

### Variables de entorno adicionales

```env
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
```

### Documentación

- **https://developers.google.com/calendar/api/v3/reference**
- **https://developers.google.com/calendar/api/guides/overview**

---

## 11. Microsoft Graph API — Outlook Calendar

> Sincronización con el calendario de Outlook/Office 365 a través de Microsoft Graph API.

> ⚡ **Importante**: Los permisos de calendario y correo YA se solicitan en el login inicial (sección 2.3). Los scopes `Calendars.ReadWrite`, `Mail.Read` y `offline_access` están incluidos. El abogado autoriza todo de una vez.

### Opción A — Usar la misma App Registration de Entra ID

1. Ve a **https://portal.azure.com** → **Microsoft Entra ID** → **App registrations**
2. Selecciona la app `Justicia Verdadera (dev)`
3. Ve a **"API permissions"** → **"Add a permission"**
4. Selecciona **"Microsoft Graph"** → **"Delegated permissions"**
5. Añade estos scopes:
   - `Calendars.ReadWrite` — Leer y escribir eventos de calendario
   - `offline_access` — Para obtener refresh_token
6. Haz clic en **"Add permissions"**
7. Haz clic en **"Grant admin consent"**

### Variables de entorno

Si usas la misma app registration, no necesitas credenciales adicionales. Los tokens de Entra ID ya incluyen los scopes de calendario.

Si creas una app separada (recomendado para producción):

```env
MS_GRAPH_CLIENT_ID=tu_client_id
MS_GRAPH_CLIENT_SECRET=tu_client_secret
MS_GRAPH_TENANT_ID=tu_tenant_id
```

### Endpoints relevantes

- Listar eventos: `GET /me/calendar/events`
- Crear evento: `POST /me/calendar/events`
- Webhook suscripción: `POST /subscriptions`

### Documentación

- **https://learn.microsoft.com/en-us/graph/api/resources/event**
- **https://learn.microsoft.com/en-us/graph/outlook-calendar-concept-overview**

---

## 12. WhatsApp Business Cloud API — Notificaciones

> Meta (Facebook) ofrece la API de WhatsApp Business Cloud para enviar mensajes a clientes. Permite enviar recordatorios de plazos, notificaciones de facturas y actualizaciones de casos vía WhatsApp.

### Requisitos previos

- Un número de teléfono **no registrado** en WhatsApp personal o Business app.
- Una cuenta de **Meta Business** (Facebook Business Manager).
- Verificación de negocio (puede tardar unos días).

### Paso a paso

1. Ve a **https://business.facebook.com**
2. Crea o selecciona tu cuenta de **Business Manager**
3. Ve a **"Configuración de la empresa"** → **"WhatsApp"** → **"Cuentas de WhatsApp"**
4. Haz clic en **"Agregar"** → **"Crear cuenta de WhatsApp Business"**
5. Sigue el asistente:
   - **Nombre del negocio**: `Justicia Verdadera`
   - **Categoría**: `Legal Services`
   - **Número de teléfono**: añade un número hondureño (+504 XXXXXXXX)
   - **Verificación**: recibirás un SMS o llamada con código
6. Una vez creada, ve a **"Configuración"** → **"WhatsApp"** → **"API setup"**
7. Copia:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **WhatsApp Business Account ID** → `WHATSAPP_BUSINESS_ACCOUNT_ID`
8. Ve a **"System Users"** (en Business Manager) → **"Add"**
   - Asigna rol **"Admin"** a la cuenta de WhatsApp
   - Genera un **token de acceso permanente**
   - Copia el token → `WHATSAPP_ACCESS_TOKEN`
9. Pega en `.env.local`:
   ```
   WHATSAPP_PHONE_NUMBER_ID=
   WHATSAPP_BUSINESS_ACCOUNT_ID=
   WHATSAPP_ACCESS_TOKEN=
   ```

### Crear plantillas de mensaje

WhatsApp requiere que los mensajes proactivos usen **plantillas pre-aprobadas**. Ejemplos:

| Nombre plantilla | Contenido | Variables |
|---|---|---|
| `recordatorio_audiencia` | "Recordatorio: Mañana {{1}} a las {{2}} tiene audiencia en {{3}}. Caso: {{4}}" | Fecha, hora, juzgado, número de caso |
| `factura_disponible` | "Su factura {{1}} por L. {{2}} está disponible. Fecha límite: {{3}}" | Número, monto, fecha vencimiento |
| `documento_nuevo` | "Se ha añadido el documento '{{1}}' a su caso {{2}}. Revíselo en el portal." | Nombre doc, número caso |

1. Ve a **"WhatsApp Manager"** → **"Plantillas de mensajes"**
2. Crea cada plantilla con las variables necesarias
3. Espera aprobación de Meta (24-48h)

### Enviar mensaje vía API

```bash
curl -X POST "https://graph.facebook.com/v22.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "504XXXXXXXX",
    "type": "template",
    "template": {
      "name": "recordatorio_audiencia",
      "language": { "code": "es" },
      "components": [{
        "type": "body",
        "parameters": [
          { "type": "text", "text": "15 de junio" },
          { "type": "text", "text": "9:00 AM" },
          { "type": "text", "text": "Juzgado de Letras Civil" },
          { "type": "text", "text": "CV-2026-0042" }
        ]
      }]
    }
  }'
```

### Costes

- WhatsApp Business Cloud: gratuito para los primeros **1,000 mensajes/mes**.
- Mensajes adicionales: ~$0.005-0.08/mensaje (varía por país).
- Honduras: tarifa estándar (~$0.05/mensaje).

### Documentación

- **https://developers.facebook.com/docs/whatsapp/cloud-api**
- **https://developers.facebook.com/docs/whatsapp/message-templates/guidelines**

---

## 13. Firma Electrónica Avanzada (FEA) — SAR Honduras

> El SAR emite su propia **Firma Electrónica Avanzada (FEA)** basada en infraestructura PKI propia. Es la opción recomendada sobre proveedores privados, ya que la FEA del SAR tiene validez plena para trámites fiscales, gubernamentales y privados en Honduras, y está respaldada por la Ley de Firmas Electrónicas (Decreto 149-2013) y su Reglamento (Decreto Ejecutivo 41-2014).

### ¿Por qué usar la FEA del SAR?

| Razón | Detalle |
|---|---|
| Validez legal plena | Reconocida por todas las instituciones del gobierno y sector privado |
| Integración SAR directa | Necesaria para facturación electrónica CFD en línea (Fase 3) |
| Coste competitivo | L. 350 (pequeño), L. 700 (mediano), L. 1,500 (gran contribuyente) |
| Vigencia | 3 años desde emisión |
| Estándar | PKCS#7, PAdES, sellado de tiempo incluido |

### Proceso de obtención de la FEA pasó a paso

```text
1. Realizar el pago en Institución 37 usando recibo TGR y rubro 12121
   └─ Monto según categoría: L. 350 / L. 700 / L. 1,500
2. Agendar cita en https://www.sar.gob.hn/citas-sar/
3. Presentarse el día de la cita con:
   ├─ Recibo TGR (pagado)
   ├─ Copia del DNI con correo electrónico anotado
   └─ Extranjeros: pasaporte
4. El trámite es personal. Personas jurídicas: debe ir el representante legal.
5. Recibir URL por correo para descargar el certificado e instalarlo.
```

### URLs oficiales SAR

| Recurso | URL |
|---|---|
| Portal FIRMA ELECTRÓNICA SAR | `https://www.sar.gob.hn/firmaelectronica` |
| Citas SAR | `https://www.sar.gob.hn/citas-sar/` |
| Reportar incidencias FEA | `https://sati.sar.gob.hn/usdkv8/#!/login/` |
| Certificado Raíz (PKI) | `https://www.sar.gob.hn/download/autoridad-de-certificacion-raiz/` |
| Certificado Subordinado | `https://www.sar.gob.hn/download/autoridad-de-certificacion-subordinada/` |
| Sellado de Tiempo | `https://www.sar.gob.hn/download/sellado-de-tiempo/` |
| Tutoriales YouTube | Videos en página de FEA (configuración, firma, validación) |

### Documentos normativos

| Documento | Descargar |
|---|---|
| Política de Certificado de FEA Persona Natural V1 | `https://www.sar.gob.hn/download/acuerdo-numero-sar-466-2024/` |
| Política de Certificado de FEA Persona Jurídica V1 | `https://www.sar.gob.hn/download/acuerdo-numero-sar-465-2024/` |
| Política de Sellado de Tiempo V1 | `https://www.sar.gob.hn/download/acuerdo-numero-sar-467-2024/` |
| Declaración de Prácticas de Certificación | `https://www.sar.gob.hn/download/declaracion-de-practicas-de-certificacion-3/` |
| Ley de Firmas Electrónicas | `https://www.sar.gob.hn/download/ley-sobre-firmas-electronicas/` |
| Reglamento de Firma Electrónica | `https://www.sar.gob.hn/download/reglamento-firma-electronica/` |

### Integración técnica planificada (Fase 2bis)

```text
1. El despacho obtiene su FEA (certificado digital PKCS#12)
2. Configurar en Justicia Verdadera:
   └─ Ruta del certificado en el servidor
   └─ Contraseña del certificado
   └─ Proveedor: "sar"
3. Flujo de firma de documentos:
   └─ Generar PDF desde plantilla o documento existente
   └─ Calcular hash SHA-256 del PDF
   └─ Firmar hash con certificado FEA (PKCS#7)
   └─ Incrustar firma en PDF (PAdES)
   └─ Añadir timestamp y metadata del certificado
   └─ Documento firmado listo para descarga
4. Flujo de verificación:
   └─ Usar Validador de Documentos Fiscales del SAR
   └─ O validar directamente con la CA Raíz del SAR
```

### Variables de entorno

```env
FIRMA_ELECTRONICA_PROVIDER=sar
FIRMA_ELECTRONICA_CERT_PATH=/etc/certs/firma-sar.p12
FIRMA_ELECTRONICA_CERT_PASSWORD=
FIRMA_ELECTRONICA_CA_ROOT_PATH=/etc/certs/sar-root-ca.crt
```

### Proveedores alternativos (si SAR no es viable)

| Proveedor | Sitio | Tipo | Estado |
|---|---|---|---|
| **Firma Virtual S.A.** | `https://www.firmavirtual.hn` | AC privada registrada | [PENDIENTE-EVALUAR] |
| **ACERTA** | `https://www.acertahn.com` | AC privada registrada | [PENDIENTE-EVALUAR] |
| **GSE** | `https://www.gse.hn` | Proveedor servicios electrónicos | [PENDIENTE-EVALUAR] |
| **Certicamara** | Internacional | AC con presencia regional | [PENDIENTE-EVALUAR] |

### Requisitos legales

- Certificado digital emitido por Autoridad Certificadora acreditada (SAR o privada registrada).
- Firma debe cumplir estándar PKCS#7 o PAdES (PDF Advanced Electronic Signatures).
- El documento firmado debe incluir timestamp y metadata del certificado.
- Conservación mínima de 5 años (Código Tributario Art. 112).

### Nota

La integración con firma electrónica es **Fase 2bis**. Mientras tanto, los documentos pueden descargarse en PDF y firmarse manualmente o con herramientas externas. La FEA del SAR es la opción recomendada por su integración directa con el ecosistema fiscal hondureño.

---

## 14. pgvector — Vector Store en Neon DB

> `pgvector` es una extensión de PostgreSQL que permite almacenar y buscar vectores de embeddings. Esencial para el sistema RAG de IA jurídica (búsqueda semántica de jurisprudencia).

### Activar la extensión

Neon DB soporta `pgvector` nativamente. Solo necesitas ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

O desde Drizzle:

```bash
cd app
npx drizzle-kit push
```

La extensión ya está incluida en el plan de Neon (Launch+). **No requiere configuración adicional ni API keys.**

### Crear tabla de documentos legales

```sql
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,          -- Fuente: 'codigo_civil', 'sentencia_csj', etc.
  title TEXT NOT NULL,           -- Título del documento legal
  content TEXT NOT NULL,         -- Texto completo
  chunk_index INTEGER NOT NULL,  -- Índice del chunk dentro del documento
  embedding vector(1536),        -- Vector de 1536 dimensiones (text-embedding-3-small)
  metadata JSONB,                -- Metadatos: fecha, sala, ponente, etc.
  created_at TIMESTAMP DEFAULT now()
);

-- Índice para búsqueda de similitud
CREATE INDEX ON legal_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Búsqueda semántica

```sql
SELECT title, content, metadata,
       1 - (embedding <=> query_embedding) AS similarity
FROM legal_documents
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

> **Nota**: El operador `<=>` es distancia coseno. `1 - distancia` da la similitud.

### Documentación

- **https://neon.tech/docs/extensions/pgvector**
- **https://github.com/pgvector/pgvector**

---

## 15. Embeddings API — text-embedding-3-small

> Para generar vectores de embeddings desde el texto legal. Usamos el modelo `text-embedding-3-small` de OpenAI (1536 dimensiones, ~$0.02/1M tokens). Alternativa: modelo local con sentence-transformers.

### Opción A — OpenAI (recomendado para empezar)

1. Ve a **https://platform.openai.com**
2. Regístrate o inicia sesión
3. Ve a **https://platform.openai.com/api-keys**
4. Haz clic en **"Create new secret key"**
5. Nombre: `justicia-verdadera-embeddings`
6. Pega en `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Coste estimado

- text-embedding-3-small: **$0.02 / 1M tokens**
- Un documento legal típico tiene ~2,000 tokens → $0.00004 por documento
- 1,000 documentos legales → ~$0.04
- Muy económico para el corpus legal hondureño completo

### Opción B — Modelo local (sin coste recurrente)

Si prefieres no depender de OpenAI:

```bash
npm install @xenova/transformers
```

```typescript
import { pipeline } from "@xenova/transformers";

const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2" // 384 dimensiones, gratuito
);

const embedding = await embedder(textoLegal, {
  pooling: "mean",
  normalize: true,
});
```

**Pros**: gratuito, sin API key, sin latencia de red.
**Contras**: 384 dimensiones (menos precisión que 1536), carga el modelo en memoria (~80MB).

### Variables de entorno

```env
# Opción A (OpenAI):
OPENAI_API_KEY=

# Opción B (local, no requiere API key):
EMBEDDINGS_PROVIDER=local
```

### Documentación

- OpenAI: **https://platform.openai.com/docs/guides/embeddings**
- Xenova: **https://huggingface.co/Xenova/all-MiniLM-L6-v2**

---

## 16. SAR — Servicio de Administración de Rentas (Honduras) — Integración Fiscal

> El SAR es la autoridad fiscal hondureña. Este conjunto de integraciones permite a Justicia Verdadera gestionar la facturación SAR-compliant, declaraciones, libros contables y cumplimiento fiscal desde la plataforma. No existe una API REST pública del SAR (junio 2026), por lo que la integración se realiza mediante exportación de datos estructurados + automatización del portal web.

### Visión general del ecosistema SAR digital

| Portal / Herramienta | URL | Uso en JV |
|---|---|---|
| **Oficina Virtual SAR** | `https://oficinavirtual.sar.gob.hn` | Declaraciones ISV/ISR, gestión de CAI, presentación de libros |
| **Portal SAR (informativo)** | `https://www.sar.gob.hn` | Normativa, calendario fiscal, guías |
| **Calendario Fiscal** | `https://oficinavirtual.sar.gob.hn/calendario-fiscal` | Consulta de fechas límite |
| **Validador de Documentos Fiscales** | `https://oficinavirtual.sar.gob.hn/fac/validador-doc-fiscales/` | Validación de facturas emitidas |
| **Verificador de Documentos SAR** | `https://oficinavirtual.sar.gob.hn/csv/` | Verificar autenticidad de documentos |
| **Tabla Pública de Imprentas** | `https://oficinavirtual.sar.gob.hn/imprentas-certificadas/` | Consultar imprentas autorizadas |
| **Firma Electrónica Avanzada** | `https://www.sar.gob.hn/firmaelectronica/` | Certificados digitales para documentos |
| **Escuela Tributaria Virtual** | `https://escuelavirtualtributaria.sar.gob.hn/` | Capacitación en temas fiscales |
| **Educación Fiscal** | `https://educacionfiscal.sar.gob.hn/` | Recursos educativos |

### 16.1 Marco normativo de facturación

| Norma | Alcance |
|---|---|
| **Acuerdo 481-2017** (Reglamento del Régimen de Facturación, Otros Documentos Fiscales y Registro Fiscal de Imprentas) | Marco principal. Define tipos de documentos fiscales, requisitos de CAI, plazos, sanciones. |
| **Acuerdo 609-2017** | Primera reforma al 481-2017 |
| **Acuerdo 725-2018** | Segunda reforma al 481-2017 |
| **Acuerdo 817-2018** | Tercera reforma al 481-2017 |
| **Resolución SAR-GER-2020-001** | Establece marco de facturación electrónica (CFD) |
| **Acuerdo CD-SAR-002-2025** | Nuevas disposiciones de facturación electrónica obligatoria |

### 16.2 Tipos de documentos fiscales que puede emitir un despacho

| Tipo | Código | Uso |
|---|---|---|
| Factura | FAC | Servicios profesionales generales |
| Factura de Servicios Profesionales | FPE | Servicios legales a personas jurídicas (con retención ISR) |
| Factura de Exportación | FEX | Servicios a clientes en el extranjero |
| Recibo por Honorarios Profesionales | RHP | Pagos recibidos sin factura formal (no recomendado para SAR) |
| Nota de Crédito | NCR | Anular o reducir monto de factura emitida |
| Nota de Débito | NDE | Incrementar monto de factura emitida |
| Comprobante de Retención | CRT | Constancia de retención ISR/ISV practicada |

### 16.3 Estrategia de integración por fases

| Fase | Qué se integra | Cómo | Estado |
|---|---|---|---|
| **Beta (actual)** | Exportación CSV de facturas | GET `/api/invoices/export` genera CSV para subir manualmente al portal SAR | ✅ Implementado |
| **Fase 1** | Gestión de CAIs en JV | CRUD de CAIs en Configuración → Facturación, alertas automáticas | [PENDIENTE] — Tabla `cais`, API, UI |
| **Fase 2** | Reporte mensual ISV (Formulario SAR-ISV-1) | GET `/api/invoices/reporte-isv?month=` genera CSV estructurado para declaración | [PENDIENTE] |
| **Fase 3** | Libro de Ventas ISV (Anexo LV-ISV) | GET `/api/invoices/libro-ventas?from=&to=` exporta libro mensual formato SAR | [PENDIENTE] |
| **Fase 4** | Integración CFD en línea | API REST directa al SAR (cuando esté disponible) + firma electrónica | [PENDIENTE] — Sin API SAR pública aún |

### 16.4 Exportación CSV — Portal SAR (Beta actual)

**Formato del CSV generado por `/api/invoices/export`:**
```csv
RTN_EMISOR,RTN_RECEPTOR,NUMERO_FACTURA,FECHA_EMISION,FECHA_VENCIMIENTO,SUBTOTAL,ISV_15,TOTAL,CAI,ESTADO_SAR
08019015239874,08011985012345,FAC-2026-0001,2026-01-15,2026-02-15,10000.00,1500.00,11500.00,CAI-001-2026-00001,pendiente_enviar
```

**Procedimiento para el despacho:**
1. En JV: Ir a Facturación → Exportar → Seleccionar período
2. Descargar archivo `facturas-sar-YYYY-MM-DD.csv`
3. Ir a `https://oficinavirtual.sar.gob.hn` → Iniciar sesión con credenciales SAR del despacho
4. Navegar a la sección de facturación → Carga de facturas
5. Subir el archivo CSV → El SAR valida e incorpora las facturas
6. Verificar estado en la respuesta del SAR (aceptadas/rechazadas)

### 16.5 Gestión de CAI (Código de Autorización de Impresión)

**El CAI se obtiene fuera de JV** (trámite directo con el SAR), pero se gestiona dentro de la plataforma.

**Proceso de obtención del CAI:**
1. El despacho solicita el CAI a través del portal SAR (`https://oficinavirtual.sar.gob.hn`) o mediante una imprenta autorizada (`https://oficinavirtual.sar.gob.hn/imprentas-certificadas/`)
2. El SAR emite resolución con:
   - Número de CAI (37 caracteres alfanuméricos)
   - Rango numérico autorizado (desde–hasta)
   - Fecha de emisión y fecha de vencimiento (máx 1 año)
3. El CAI puede ser:
   - **Auto-impresión** (el despacho imprime sus propias facturas con el CAI)
   - **Imprenta autorizada** (una imprenta registrada imprime las facturas)
4. Una vez obtenido, se registra en JV en Configuración → Facturación → CAIs

**Ciclo de vida del CAI en JV:**
```text
Registrar en JV (código, rango desde/hasta, vencimiento)
→ Estado: "activo"
→ JV asigna números correlativos automáticamente desde el rango
→ Cuando se alcanza el 80% del rango → alerta al administrador
→ Cuando faltan 30 días para el vencimiento → alerta al administrador
→ Cuando se agota el rango o vence → estado: "agotado" o "vencido"
→ Bloquear emisión de facturas si no hay CAI activo
```

### 16.6 Formularios y declaraciones SAR

| Formulario | Frecuencia | Fecha límite | Integración JV |
|---|---|---|---|
| **SAR-ISV-1** — Declaración mensual ISV | Mensual | Día 15 del mes siguiente | [PENDIENTE] — Reporte prellenado descargable |
| **SAR-ISR-1** — Declaración anual ISR (personas jurídicas) | Anual | 31 de marzo | [PENDIENTE] — Post-MVP |
| **SAR-ISR-2** — Declaración anual ISR (personas naturales) | Anual | 30 de abril | [PENDIENTE] — Post-MVP |
| **SAR-RET-1** — Declaración mensual de retenciones | Mensual | Día 10 del mes siguiente | [PENDIENTE] |
| **Anexo LV-ISV** — Libro de Ventas ISV | Mensual | Junto con SAR-ISV-1 | [PENDIENTE] |
| **Anexo LC-ISV** — Libro de Compras ISV | Mensual | Junto con SAR-ISV-1 | [PENDIENTE] — Requiere nueva tabla `purchase_invoices` |
| **DMC** — Declaración Mensual de Compras | Mensual | Día 15 del mes siguiente | [PENDIENTE] |

### 16.7 Calendario fiscal integrado

El sistema mostrará un dashboard con las próximas obligaciones fiscales. Los datos provienen de:
- **Calendario Fiscal oficial SAR:** `https://oficinavirtual.sar.gob.hn/calendario-fiscal`
- **Configuración manual** de fechas recordatorio (opcional)
- **Alertas automáticas** vía email/in-app 7 días antes de cada fecha límite

### 16.8 Validación de RTN

El SAR ofrece una herramienta pública de verificación de RTN en `https://www.sar.gob.hn/registro-tributario-nacional-rtn/`. Justicia Verdadera integrará:

- **Validación de formato:** 14 dígitos con dígito verificador
- **Formato oficial:** `X-XXXX-XXXX-XXXXX` (almacenado sin guiones en BD, con guiones en display)
- **Validación contra SAR:** Consulta síncrona al validador del SAR (cuando esté disponible como API)
- **Validación offline:** Algoritmo de dígito verificador (similar a módulo 11)

### Variables de entorno del ecosistema SAR

```env
# Configuración del despacho (se gestiona en UI, no en .env)
# Estas se almacenan en firms.settings y en la tabla cais:
# firms.taxId → RTN del despacho (14 dígitos)
# firms.isvRate → Tasa ISV (default 15)

# Para integración futura CFD en línea:
SAR_FEA_CERT_PATH=
SAR_FEA_CERT_PASSWORD=
SAR_API_URL=https://oficinavirtual.sar.gob.hn/api  # placeholder, no pública aún
```

### Documentación y recursos SAR

| Recurso | URL |
|---|---|
| Portal oficial SAR | `https://www.sar.gob.hn` |
| Oficina Virtual | `https://oficinavirtual.sar.gob.hn` |
| Calendario Fiscal | `https://oficinavirtual.sar.gob.hn/calendario-fiscal` |
| Validador Documentos Fiscales | `https://oficinavirtual.sar.gob.hn/fac/validador-doc-fiscales/` |
| Verificador Documentos SAR | `https://oficinavirtual.sar.gob.hn/csv/` |
| Facturación (normativa) | `https://www.sar.gob.hn/facturacion/` |
| Firma Electrónica | `https://www.sar.gob.hn/firmaelectronica/` |
| RTN (inscripción/consulta) | `https://www.sar.gob.hn/registro-tributario-nacional-rtn/` |
| Leyes tributarias | `https://www.sar.gob.hn/leyes/` |
| Impuesto Sobre Ventas (ISV) | `https://www.sar.gob.hn/impuesto-sobre-ventas-isv/` |
| Impuesto Sobre Renta (ISR) | `https://www.sar.gob.hn/impuesto-sobre-renta-isr/` |
| Declaración Mensual Retenciones | `https://www.sar.gob.hn/declaracion-mensual-de-retenciones-dmr/` |
| Orientación tributaria | `asistencia@sar.gob.hn` — Tel: 2216-5800 |
| Reportar incidencias FEA | `https://sati.sar.gob.hn/usdkv8/#!/login/` |

---

## Resumen Rápido — Checklist de Registro

Marca cada servicio conforme lo configures. Los números corresponden a las secciones de esta guía.

### ✅ Servicios activos (ya funcionando)

```
[ ] 1.  Neon DB          → https://neon.tech               → DATABASE_URL
[ ] 2.  AUTH_SECRET      → Local (npx auth secret)          → AUTH_SECRET
[ ] 3.  Google OAuth     → https://console.cloud.google.com → AUTH_GOOGLE_ID + SECRET
[ ] 4.  Microsoft Entra ID → https://portal.azure.com       → AUTH_MICROSOFT_ENTRA_ID_ID + SECRET
[ ] 5.  DeepSeek V4      → https://platform.deepseek.com    → DEEPSEEK_API_KEY
[ ] 6.  Upstash Redis    → https://console.upstash.com      → UPSTASH_REDIS_REST_URL + TOKEN
[ ] 7.  UploadThing      → https://uploadthing.com          → UPLOADTHING_TOKEN
[ ] 8.  Resend           → https://resend.com               → RESEND_API_KEY + FROM_EMAIL
[ ] 9.  Lemon Squeezy    → https://lemonsqueezy.com         → LEMON_SQUEEZY_API_KEY + STORE_ID + productos
[ ] 10. Inngest          → https://app.inngest.com          → INNGEST_EVENT_KEY
[ ] 11. pgvector (Neon)  → Extensión nativa                  → N/A
```

### ⚠️ Servicios pendientes (Fase 2 y 2bis)

```
[ ] 12. Vercel (prod)    → https://vercel.com               → Variables de producción
[ ] 13. Google Calendar  → https://console.cloud.google.com  → GOOGLE_CALENDAR_CLIENT_ID + SECRET
[ ] 14. Microsoft Graph  → https://portal.azure.com         → MS_GRAPH_CLIENT_ID + SECRET
[ ] 15. WhatsApp Cloud   → https://business.facebook.com    → WHATSAPP_ACCESS_TOKEN + IDs
[ ] 16. Firma Electrónica SAR → https://www.sar.gob.hn/firmaelectronica → Certificado FEA (L.350–L.1,500)
[ ] 17. SAR Oficina Virtual  → https://oficinavirtual.sar.gob.hn → Cuenta SAR del despacho + CAI
[ ] 18. Validación RTN       → https://www.sar.gob.hn/registro-tributario-nacional-rtn → N/A (herramienta pública)
```

## Orden recomendado de configuración

Configura los servicios en este orden para ir desbloqueando funcionalidad progresivamente:

### Fase 0 — Imprescindible (sin esto no funciona nada)
1. **Neon DB** — base de datos
2. **AUTH_SECRET** — se genera local, 1 minuto
3. **Google OAuth** — login principal
4. **Microsoft Entra ID** — login alternativo (Office 365)

### Fase 1 — MVP Core
5. **DeepSeek** — IA jurídica completa
6. **Upstash Redis** — rate limiting y caché
7. **UploadThing** — subida de documentos
8. **Resend** — emails

### Fase 1.5 — Monetización
9. **Lemon Squeezy** — pasarela de pagos MoR (crear productos en dashboard)
10. **Inngest** — workflows OCR

### Fase 2 — IA y despliegue
11. **pgvector** — extensión PostgreSQL (ya activa en Neon)
12. **Vercel** — deploy a producción

### Fase 2bis — Integraciones y facturación SAR
13. **Google Calendar** — sincronización de agenda
14. **Microsoft Graph** — sincronización con Outlook
15. **WhatsApp Cloud** — notificaciones a clientes
16. **Firma Electrónica SAR (FEA)** — firma digital de documentos
17. **SAR Oficina Virtual** — facturación electrónica, declaraciones ISV/ISR
18. **Validación RTN** — verificar RTN de clientes
