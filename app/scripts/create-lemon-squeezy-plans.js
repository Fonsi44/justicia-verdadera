#!/usr/bin/env node
/**
 * Lemon Squeezy — Creador automático de planes de suscripción
 * 
 * Uso:
 *   set "LS_EMAIL=tu@email.com" && set "LS_PASSWORD=tu_contraseña" && node scripts/create-lemon-squeezy-plans.js
 * 
 * Requisitos:
 *   - Tener @lemonsqueezy/lemonsqueezy.js instalado (npm install @lemonsqueezy/lemonsqueezy.js@latest)
 *   - El API key configurada en .env.local
 *   - Plasearight instalado (npx playwright install chromium)
 */

const { chromium } = require("playwright");

const PLANS = [
  {
    name: "Justicia Verdadera — Starter",
    description: "1 usuario, 20 casos activos, 10 prompts IA/mes",
    price: 29,
    features: "1 usuario\n20 casos activos\n10 prompts IA al mes\nDocumentos ilimitados\nSoporte por email",
  },
  {
    name: "Justicia Verdadera — Profesional",
    description: "3 usuarios, 100 casos activos, 50 prompts IA/mes",
    price: 79,
    features: "3 usuarios\n100 casos activos\n50 prompts IA al mes\nDocumentos ilimitados\nOCR básico incluido\nSoporte prioritario",
  },
  {
    name: "Justicia Verdadera — Despacho",
    description: "10 usuarios, casos ilimitados, 200 prompts IA/mes",
    price: 199,
    features: "10 usuarios\nCasos ilimitados\n200 prompts IA al mes\nDocumentos ilimitados\nOCR avanzado\nSoporte dedicado\nPersonalización",
  },
];

async function main() {
  const email = process.env.LS_EMAIL;
  const password = process.env.LS_PASSWORD;

  if (!email || !password) {
    console.error("Error: Define LS_EMAIL y LS_PASSWORD como variables de entorno");
    console.error('Ejemplo: set "LS_EMAIL=tu@email.com" && set "LS_PASSWORD=tu_pass" && node scripts/create-lemon-squeezy-plans.js');
    process.exit(1);
  }

  console.log("=== Creador de Planes Lemon Squeezy ===\n");
  console.log("Iniciando navegador...");

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    // 1. Login
    console.log("1. Iniciando sesion en app.lemonsqueezy.com...");
    await page.goto("https://app.lemonsqueezy.com", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Check if already logged in
    if (page.url().includes("auth/login") || page.url().includes("sign-in")) {
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      await page.waitForLoadState("networkidle");
      console.log("   Sesion iniciada correctamente");
    } else {
      console.log("   Ya hay sesion activa");
    }

    // 2. Navigate to products
    console.log("2. Navegando a productos...");
    await page.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    for (const plan of PLANS) {
      console.log(`\n3. Creando plan: ${plan.name} ($${plan.price}/mes)`);

      // Click "Create your first product" or "New product"
      const newBtn = page.locator('a:has-text("New product"), button:has-text("New product"), a:has-text("Create your first")');
      if (await newBtn.isVisible()) {
        await newBtn.click();
      } else {
        // Try the header button
        await page.locator('header a:has-text("New"), header button:has-text("New")').first().click();
      }
      await page.waitForTimeout(2000);

      // Fill product name
      await page.fill('input[name="name"], input[id="name"], input[placeholder*="name"]', plan.name);
      await page.waitForTimeout(500);

      // Fill description
      const descField = page.locator('textarea[name="description"], textarea[id="description"], [contenteditable="true"]').first();
      if (await descField.isVisible()) {
        await descField.fill(plan.description);
      }
      await page.waitForTimeout(500);

      // Set price
      const priceField = page.locator('input[name*="price"], input[type="number"]').first();
      if (await priceField.isVisible()) {
        await priceField.fill(plan.price.toString());
      }
      await page.waitForTimeout(500);

      // Click submit/save
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        console.log(`   Plan creado exitosamente`);
      } else {
        console.log(`   No se encontro el boton de guardar. Revisa el navegador.`);
      }

      // Go back to products list for next plan
      await page.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
    }

    console.log("\n=== Todos los planes creados exitosamente ===");
    console.log("Puedes verlos en: https://app.lemonsqueezy.com/products\n");

  } catch (err) {
    console.error("Error durante la automatizacion:", err.message);
    console.log("\nEl navegador seguira abierto para que completes manualmente.");
  }

  console.log("\nNavegador abierto. Cuando termines, cierralo manualmente o presiona Ctrl+C.");
  // Keep browser open for manual completion if needed
  await new Promise(() => {});
}

main().catch(console.error);
