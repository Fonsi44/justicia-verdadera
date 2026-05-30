#!/usr/bin/env node
/**
 * Lemon Squeezy — Verificador de configuracion
 * 
 * Uso: node scripts/verify-lemon-squeezy.js
 */
const fs = require("fs");

// Load API key from .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const apiKey = envContent.match(/LEMON_SQUEEZY_API_KEY=(.+)/)?.[1];
const webhookSecret = envContent.match(/LEMON_SQUEEZY_WEBHOOK_SECRET=(.+)/)?.[1];

if (!apiKey) {
  console.error("Error: LEMON_SQUEEZY_API_KEY no encontrada en .env.local");
  process.exit(1);
}

async function main() {
  console.log("=== Verificacion de Lemon Squeezy ===\n");

  // Store info
  const storesRes = await fetch("https://api.lemonsqueezy.com/v1/stores", {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const stores = await storesRes.json();
  const store = stores.data?.[0];

  if (!store) {
    console.log("No se encontro la tienda. Verifica tu API key.");
    process.exit(1);
  }

  console.log(`Tienda: ${store.attributes.name}`);
  console.log(`Store ID: ${store.id}`);
  console.log(`URL: ${store.attributes.url}`);
  console.log(`Pais: ${store.attributes.country_nicename}`);
  console.log(`Moneda: ${store.attributes.currency}`);
  console.log(`Plan: ${store.attributes.plan}`);
  console.log(`Ventas totales: $${store.attributes.total_revenue}`);
  console.log();

  // Products
  const productsRes = await fetch(
    `https://api.lemonsqueezy.com/v1/products?filter[store_id]=${store.id}`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } }
  );
  const products = await productsRes.json();

  if (products.data?.length === 0) {
    console.log("No hay productos creados aun.");
    console.log("Los planes no pueden crearse por API. Debes crearlos manualmente en:");
    console.log("  https://app.lemonsqueezy.com/products");
    console.log("\nInstrucciones en: scripts/setup-lemon-squeezy.js");
    console.log("O ejecuta: node scripts/setup-lemon-squeezy.js\n");
  } else {
    console.log(`Productos encontrados: ${products.data.length}\n`);
    for (const product of products.data) {
      const variantsRes = await fetch(
        `https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${product.id}`,
        { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } }
      );
      const variants = await variantsRes.json();

      console.log(`  Producto: ${product.attributes.name}`);
      console.log(`  Product ID: ${product.id}`);
      console.log(`  Descripcion: ${product.attributes.description}`);
      console.log(`  Status: ${product.attributes.status}`);

      if (variants.data?.length > 0) {
        for (const variant of variants.data) {
          console.log(`  Variante: ${variant.attributes.name} — $${parseInt(variant.attributes.price).toFixed(2)}/${variant.attributes.interval}`);
          console.log(`  Variant ID: ${variant.id}`);
        }
      }
      console.log();
    }
  }

  // Webhooks
  const webhooksRes = await fetch(
    `https://api.lemonsqueezy.com/v1/webhooks?filter[store_id]=${store.id}`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" } }
  );
  const webhooks = await webhooksRes.json();

  if (webhooks.data?.length > 0) {
    console.log(`Webhooks configurados: ${webhooks.data.length}`);
    for (const wh of webhooks.data) {
      console.log(`  URL: ${wh.attributes.url}`);
      console.log(`  Eventos: ${wh.attributes.events.join(", ")}`);
    }
  } else {
    console.log("No hay webhooks configurados. Configuralos en:");
    console.log("  https://app.lemonsqueezy.com/settings/webhooks");
    console.log("  URL: http://localhost:3000/api/webhooks/lemon-squeezy");
    console.log("  Events: order_created, subscription_created, subscription_updated, subscription_cancelled");
  }

  console.log();

  if (webhookSecret) {
    console.log("✅ Webhook Secret configurado en .env.local");
  } else {
    console.log("⚠️ Webhook Secret no configurado en .env.local");
  }

  console.log(`\n=== SDK: ${products.data?.length === 0 ? "Pendiente crear productos" : "Configuracion completa"} ===`);
}

main().catch(console.error);
