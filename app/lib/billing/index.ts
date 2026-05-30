import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let lsConfigured = false;

export function getLemonSqueezy(): boolean {
  if (!process.env.LEMON_SQUEEZY_API_KEY) return false;
  if (!lsConfigured) {
    lemonSqueezySetup({
      apiKey: process.env.LEMON_SQUEEZY_API_KEY,
    });
    lsConfigured = true;
  }
  return true;
}

// Planes en HNL (Honduras Lempiras) — fuente de verdad: master.md
// Los precios se gestionan desde el dashboard de Lemon Squeezy.
// Estos valores son solo de referencia para el frontend.
export const PLANS = {
  starter: {
    name: "Starter",
    amount: 750,
    currency: "HNL",
    features: ["1 usuario", "20 casos activos", "10 prompts IA/mes"],
    productId: process.env.LS_PRODUCT_STARTER_ID ?? "",
    variantId: process.env.LS_VARIANT_STARTER_ID ?? "",
  },
  profesional: {
    name: "Profesional",
    amount: 2050,
    currency: "HNL",
    features: ["3 usuarios", "100 casos activos", "50 prompts IA/mes"],
    productId: process.env.LS_PRODUCT_PROFESIONAL_ID ?? "",
    variantId: process.env.LS_VARIANT_PROFESIONAL_ID ?? "",
  },
  despacho: {
    name: "Despacho",
    amount: 5150,
    currency: "HNL",
    features: ["10 usuarios", "Casos ilimitados", "200 prompts IA/mes"],
    productId: process.env.LS_PRODUCT_DESPACHO_ID ?? "",
    variantId: process.env.LS_VARIANT_DESPACHO_ID ?? "",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ── Stripe (archivado) ──
// Stripe no es la pasarela principal. Lemon Squeezy es el Merchant of Record.
// Si se necesita reactivar Stripe en el futuro, descomentar el bloque siguiente.
//
// import Stripe from "stripe";
// let stripeInstance: Stripe | null = null;
// export function getStripe(): Stripe | null {
//   if (!process.env.STRIPE_SECRET_KEY) return null;
//   if (!stripeInstance) {
//     stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
//       apiVersion: "2026-05-27.dahlia",
//       typescript: true,
//     });
//   }
//   return stripeInstance;
// }