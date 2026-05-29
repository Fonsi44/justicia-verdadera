import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const PLANS = {
  starter: {
    name: "Starter",
    amount: 29,
    features: ["1 usuario", "20 casos activos", "10 prompts IA/mes"],
  },
  profesional: {
    name: "Profesional",
    amount: 79,
    features: ["3 usuarios", "100 casos activos", "50 prompts IA/mes"],
  },
  despacho: {
    name: "Despacho",
    amount: 199,
    features: ["10 usuarios", "Casos ilimitados", "200 prompts IA/mes"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
