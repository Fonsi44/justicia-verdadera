#!/usr/bin/env node
/**
 * Lemon Squeezy Setup — Abre el dashboard para crear los planes manualmente
 * 
 * Requisito: node scripts/setup-lemon-squeezy.js
 */
const { execSync } = require("child_process");

const STORE_URL = "https://justicia-verdadera.lemonsqueezy.com";
const DASHBOARD_PRODUCTS = "https://app.lemonsqueezy.com/products";

console.log(`
=============================================
  Lemon Squeezy — Crear Planes de Suscripcion
=============================================

  Tienda: ${STORE_URL}
  Store ID: 391910

  Instrucciones:

  1. Abre el dashboard: ${DASHBOARD_PRODUCTS}
  2. Haz clic en "New product" (esquina superior derecha)

  Crea estos 3 productos UNO POR UNO:

  ┌─────────────────────────────────────────────────────────┐
  │ PLAN 1: Starter                                        │
  ├─────────────────────────────────────────────────────────┤
  │ Name:        Justicia Verdadera — Starter              │
  │ Description: 1 usuario, 20 casos activos, 10 prompts IA│
  │ Price:       750.00 HNL — Recurring → Monthly           │
  │ Variant:     Mensual                                   │
  ├─────────────────────────────────────────────────────────┤
  │ PLAN 2: Profesional                                    │
  ├─────────────────────────────────────────────────────────┤
  │ Name:        Justicia Verdadera — Profesional          │
  │ Description: 3 usuarios, 100 casos activos, 50 prompts │
  │ Price:       2,050.00 HNL — Recurring → Monthly         │
  │ Variant:     Mensual                                   │
  ├─────────────────────────────────────────────────────────┤
  │ PLAN 3: Despacho                                       │
  ├─────────────────────────────────────────────────────────┤
  │ Name:        Justicia Verdadera — Despacho             │
  │ Description: 10 usuarios, casos ilimitados, 200 prompts│
  │ Price:       5,150.00 HNL — Recurring → Monthly         │
  │ Variant:     Mensual                                   │
  └─────────────────────────────────────────────────────────┘

  3. Despues de crear cada plan, copia los IDs:
     - Product ID (lo ves en la URL: /products/PRODUCT_ID)
     - Variant ID (lo ves en la URL: /variants/VARIANT_ID)

  4. Guardalos en .env.local como:
     STORE_ID=391910
     LS_PRODUCT_STARTER_ID=
     LS_PRODUCT_PROFESIONAL_ID=
     LS_PRODUCT_DESPACHO_ID=
     LS_VARIANT_STARTER_ID=
     LS_VARIANT_PROFESIONAL_ID=
     LS_VARIANT_DESPACHO_ID=

  5. Configuracion de Webhooks:
     URL:  http://localhost:3000/api/webhooks/lemon-squeezy
     Events: order_created, subscription_created, 
             subscription_updated, subscription_cancelled
     En: https://app.lemonsqueezy.com/settings/webhooks

  Presiona ENTER para abrir el dashboard...
`);

process.stdin.once("data", () => {
  console.log("Abriendo dashboard...");
  try {
    execSync(`start "" "https://app.lemonsqueezy.com/products"`, { shell: true });
  } catch {
    try {
      execSync(`open "https://app.lemonsqueezy.com/products"`, { shell: true });
    } catch {
      console.log("Abre manualmente: https://app.lemonsqueezy.com/products");
    }
  }
  console.log("\nCuando termines, anota los IDs y guardalos en .env.local");
  console.log("Luego ejecuta: node scripts/verify-lemon-squeezy.js\n");
});
