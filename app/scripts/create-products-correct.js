const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-final-create",
    { headless: false }
  );
  const p = await ctx.newPage();

  await p.goto("https://auth.lemonsqueezy.com/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.fill("#email", process.env.LS_EMAIL);
  await p.fill("#password", process.env.LS_PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);

  const products = [
    { name: "Justicia Verdadera - Starter", price: "29", desc: "1 usuario, 20 casos activos, 10 prompts IA/mes" },
    { name: "Justicia Verdadera - Profesional", price: "79", desc: "3 usuarios, 100 casos activos, 50 prompts IA/mes" },
    { name: "Justicia Verdadera - Despacho", price: "199", desc: "10 usuarios, casos ilimitados, 200 prompts IA/mes" },
  ];

  // Check existing products
  const key = process.env.LS_API_KEY || fs.readFileSync(".env.local","utf8").match(/LEMON_SQUEEZY_API_KEY=(.+)/m)[1].trim();

  const ids = {};
  for (const prod of products) {
    console.log(`\n=== ${prod.name} $${prod.price} ===`);
    
    await p.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
    await p.waitForTimeout(2000);
    
    // Click "New Product"
    await p.locator('button:has-text("New Product")').click();
    await p.waitForTimeout(2000);

    // Fill name
    await p.fill("#input_name", prod.name);
    console.log("  Name filled");

    // Select "Subscription" radio by clicking its label
    const subLabel = p.locator('label:has-text("Subscription")').first();
    if (await subLabel.isVisible().catch(() => false)) {
      await subLabel.click();
      await p.waitForTimeout(500);
      console.log("  Subscription selected");
    }

    // Wait for price field to appear (it may appear after selecting subscription)
    await p.waitForTimeout(1000);

    // Fill price
    await p.fill("#input_price", prod.price);
    console.log("  Price filled");

    // Scroll down to see Tax category - try to select "General" or similar default
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(500);

    // Click the tax category dropdown search input
    const taxInput = p.locator('input.vs__search').first();
    if (await taxInput.isVisible().catch(() => false)) {
      await taxInput.click();
      await p.waitForTimeout(500);
      await taxInput.fill("General");
      await p.waitForTimeout(500);
      await p.keyboard.press("Enter");
      await p.waitForTimeout(500);
      console.log("  Tax category selected");
    }

    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(500);

    // Take screenshot before saving
    await p.screenshot({ path: `scripts/${prod.name.substring(0,8)}-before-save.png`, fullPage: true });

    // Find the Save button - try multiple approaches
    const saveBtn = p.locator('button[type="submit"]').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      console.log("  Save clicked");
    } else {
      // Try keyboard submit
      await p.keyboard.press("Control+Enter");
      console.log("  Ctrl+Enter sent");
    }
    
    await p.waitForTimeout(5000);

    // Get product ID from URL
    const curUrl = p.url();
    console.log("  URL:", curUrl.substring(0, 100));
    const m = curUrl.match(/\/products\/(\d+)/);
    if (m) {
      ids[prod.name] = m[1];
      console.log(`  Product ID: ${m[1]}`);
    }
  }

  console.log("\n=== CREATED IDs ===", JSON.stringify(ids, null, 2));

  // Update .env.local
  if (Object.keys(ids).length > 0) {
    let env = fs.readFileSync(".env.local", "utf8");
    if (ids[products[0].name]) env = env.replace(/LS_PRODUCT_STARTER_ID=.*/gm, `LS_PRODUCT_STARTER_ID=${ids[products[0].name]}`);
    if (ids[products[1].name]) env = env.replace(/LS_PRODUCT_PROFESIONAL_ID=.*/gm, `LS_PRODUCT_PROFESIONAL_ID=${ids[products[1].name]}`);
    if (ids[products[2].name]) env = env.replace(/LS_PRODUCT_DESPACHO_ID=.*/gm, `LS_PRODUCT_DESPACHO_ID=${ids[products[2].name]}`);
    fs.writeFileSync(".env.local", env);
    console.log("IDs saved to .env.local");
  }

  // Verify via API
  console.log("\n=== Verifying via API ===");
  const res = await fetch("https://api.lemonsqueezy.com/v1/products?filter[store_id]=391910", {
    headers: { Authorization: "Bearer "+key, Accept: "application/json" }
  });
  const data = await res.json();
  console.log(`Products found: ${data.data?.length || 0}`);
  for (const p of data.data || []) {
    console.log(`  ${p.id}: ${p.attributes.name} (${p.attributes.status})`);

    // Get variants
    const v = await fetch(`https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${p.id}`, {
      headers: { Authorization: "Bearer "+key, Accept: "application/json" }
    });
    const vd = await v.json();
    for (const vt of vd.data || []) {
      const attrs = vt.attributes;
      console.log(`    Variant ${vt.id}: ${attrs.name} $${parseInt(attrs.price)/100}/${attrs.interval} status=${attrs.status}`);
    }
  }
})();
