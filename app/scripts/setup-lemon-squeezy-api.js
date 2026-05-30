const ls = require("@lemonsqueezy/lemonsqueezy.js");
const fs = require("fs");

const key = fs.readFileSync(".env.local","utf8").match(/LEMON_SQUEEZY_API_KEY=(.+)/m)[1].trim();
ls.lemonSqueezySetup({ apiKey: key });

function dd(d) { return d?.data?.data; }
function da(d) { return d?.data?.data || []; }

async function main() {
  console.log("=== LEMON SQUEEZY API SETUP ===\n");

  // 1. STORE INFO
  const store = await ls.getStore(391910);
  const s = dd(store);
  console.log("Store:", s?.attributes?.name);
  console.log("Plan:", s?.attributes?.plan);
  console.log("Country:", s?.attributes?.country_nicename);
  console.log("Currency:", s?.attributes?.currency);

  // 2. WEBHOOKS
  console.log("\n=== WEBHOOKS ===");
  const whs = await ls.listWebhooks({ filter: { store_id: 391910 } });
  const webhooks = da(whs);
  if (webhooks.length) {
    for (const wh of webhooks) {
      console.log("ID:", wh.id, "| URL:", wh.attributes.url.substring(0, 60));
      console.log("  Events:", wh.attributes.events.join(", "));
    }
  } else {
    console.log("No webhooks - would create one");
    // Already verified it exists earlier
  }

  // 3. PRODUCTS & VARIANTS
  console.log("\n=== PRODUCTS & VARIANTS ===");
  const products = await ls.listProducts({ filter: { store_id: 391910 } });
  const prods = da(products);
  if (prods.length) {
    for (const p of prods) {
      console.log("[" + p.id + "]", p.attributes.name, "(" + p.attributes.status + ")");
      const vars = await ls.listVariants({ filter: { product_id: p.id } });
      for (const v of da(vars)) {
        const pr = parseInt(v.attributes.price) / 100;
        console.log("  + Variant [" + v.id + "]", v.attributes.name, "($" + pr.toFixed(2) + "/" + v.attributes.interval + ") [" + v.attributes.status + "]");
      }
    }
  } else {
    console.log("No products yet");
  }

  // 4. BETAS DISCOUNTS
  console.log("\n=== BETA DISCOUNTS ===");
  const existingDiscs = await ls.listDiscounts({ filter: { store_id: 391910 } });
  const discCodes = new Set((da(existingDiscs) || []).map((d) => d.attributes.code));
  console.log("Existing discounts:", [...discCodes].join(", ") || "none");

  const betas = [
    { name: "Beta Early Adopter 50%", code: "BETA50", amount: 50, amountType: "percent", isLimitedRedemptions: true, maxRedemptions: 20, duration: "forever" },
    { name: "Beta Founder 30%", code: "FOUNDER30", amount: 30, amountType: "percent", isLimitedRedemptions: true, maxRedemptions: 50, duration: "forever" },
    { name: "Beta Launch 25%", code: "LAUNCH25", amount: 25, amountType: "percent", isLimitedRedemptions: true, maxRedemptions: 100, duration: "forever" },
  ];

  for (const b of betas) {
    if (discCodes.has(b.code)) {
      console.log("Already exists:", b.code);
      continue;
    }
    try {
      const r = await ls.createDiscount({
        storeId: 391910,
        name: b.name,
        code: b.code,
        amount: b.amount,
        amountType: b.amountType,
        isLimitedRedemptions: b.isLimitedRedemptions,
        maxRedemptions: b.maxRedemptions,
        duration: b.duration,
      });
      const d = dd(r);
      console.log("Created: " + b.code + " (ID: " + (d?.id || r.data?.data?.id || "?") + ") " + (r.error ? "error: " + JSON.stringify(r.error).substring(0, 100) : "ok"));
    } catch (e) {
      console.log("Error creating " + b.code + ": " + e.message.substring(0, 120));
    }
  }

  // 5. STORE URL IN .env.local
  let env = fs.readFileSync(".env.local", "utf8");
  if (!env.includes("LS_STORE_URL")) {
    env += "\n# Lemon Squeezy store\nLS_STORE_URL=https://justicia-verdadera.lemonsqueezy.com\n";
    fs.writeFileSync(".env.local", env);
    console.log("\nAdded LS_STORE_URL to .env.local");
  }

  // 6. CREATE WEBHOOK HANDLER IF NOT EXISTS
  const whPath = "app/api/webhooks/lemon-squeezy/route.ts";
  if (!fs.existsSync(whPath)) {
    console.log("\nWebhook handler missing - would create at: " + whPath);
  } else {
    console.log("\nWebhook handler exists: " + whPath);
  }

  // 7. Verify checkout link generation
  console.log("\n=== CHECKOUT LINKS ===");
  if (prods.length) {
    for (const p of prods) {
      const vars = await ls.listVariants({ filter: { product_id: p.id } });
      for (const v of da(vars)) {
        if (v.attributes.status === "pending") {
          console.log("Variant " + v.id + " for " + p.attributes.name + " is pending - checkout not available");
        } else {
          console.log("Can create checkout: product=" + p.id + " variant=" + v.id);
          // Example: await ls.createCheckout({ store_id: 391910, variant_id: v.id, ... })
        }
      }
    }
  }

  console.log("\n=== DONE ===");
}

main().catch((e) => console.error("Error:", e.message));
