const { chromium } = require("playwright");
const fs = require("fs");

const PLANS = [
  { name: "Justicia Verdadera - Starter", price: 29, desc: "Para abogados independientes" },
  { name: "Justicia Verdadera - Profesional", price: 79, desc: "Para despachos en crecimiento" },
  { name: "Justicia Verdadera - Despacho", price: 199, desc: "Para despachos consolidados" },
];

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-v4-" + Date.now(),
    { headless: false }
  );
  const p = await ctx.newPage();
  
  await p.goto("https://auth.lemonsqueezy.com/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.fill("#email", process.env.LS_EMAIL);
  await p.fill("#password", process.env.LS_PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);

  const ids = {};
  let env = fs.readFileSync(".env.local", "utf8");

  for (const plan of PLANS) {
    console.log(`\n=== ${plan.name} ($${plan.price}) ===`);
    await p.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
    await p.waitForTimeout(2000);

    // Click "New Product" button
    const btn = p.locator('button:has-text("New Product")');
    await btn.click();
    await p.waitForTimeout(3000);

    // Get form structure
    const formHtml = await p.evaluate(() => {
      const modals = document.querySelectorAll("[role=dialog], [class*=modal], [class*=overlay], [class*=drawer]");
      for (const modal of modals) {
        if (modal.offsetParent !== null) {
          return Array.from(modal.querySelectorAll("input, textarea, select, label, button")).map(el => ({
            tag: el.tagName, id: el.id, name: el.getAttribute("name"), type: el.getAttribute("type"),
            placeholder: el.getAttribute("placeholder"), text: (el.textContent||"").trim().substring(0,40),
          }));
        }
      }
      return [];
    });
    console.log("Modal form elements:", JSON.stringify(formHtml, null, 2));
    await p.screenshot({ path: `scripts/modal-${plan.name.substring(0,8)}.png` });

    // If we can identify fields, fill them
    // Look for name input
    const nameField = await p.locator('input[type="text"]').first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill(plan.name);
      console.log("Filled name");
    }

    // Look for price input
    const priceField = await p.locator('input[type="number"]').first();
    if (await priceField.isVisible().catch(() => false)) {
      await priceField.fill(plan.price.toString());
      console.log("Filled price");
    }

    await p.screenshot({ path: `scripts/modal-${plan.name.substring(0,8)}-filled.png` });

    // Click save
    const saveBtn = p.locator('button:has-text("Save"), button[type="submit"]').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await p.waitForTimeout(5000);
      console.log("Clicked Save");
    }

    // Get URL to extract product ID
    const curUrl = p.url();
    console.log("URL:", curUrl.substring(0, 100));
    const m = curUrl.match(/\/products\/(\d+)/);
    if (m) {
      ids[plan.name] = m[1];
      console.log(`Product ID: ${m[1]}`);
    }
  }

  console.log("\n=== IDs ===", JSON.stringify(ids, null, 2));
  if (ids[PLANS[0].name]) env = env.replace(/LS_PRODUCT_STARTER_ID=.*/m, `LS_PRODUCT_STARTER_ID=${ids[PLANS[0].name]}`);
  if (ids[PLANS[1].name]) env = env.replace(/LS_PRODUCT_PROFESIONAL_ID=.*/m, `LS_PRODUCT_PROFESIONAL_ID=${ids[PLANS[1].name]}`);
  if (ids[PLANS[2].name]) env = env.replace(/LS_PRODUCT_DESPACHO_ID=.*/m, `LS_PRODUCT_DESPACHO_ID=${ids[PLANS[2].name]}`);
  fs.writeFileSync(".env.local", env);
  console.log("Updated .env.local");
})();
