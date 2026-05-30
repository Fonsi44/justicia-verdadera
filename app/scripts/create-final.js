const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-create-done",
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
  const ids = {};

  for (const prod of products) {
    console.log(`\n=== ${prod.name} $${prod.price} ===`);
    await p.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
    await p.waitForTimeout(2000);

    // Click "New Product"
    await p.locator('button:has-text("New Product")').click();
    await p.waitForTimeout(3000);

    // Fill name
    await p.fill("#input_name", prod.name);
    console.log("  Name done");

    // Select Subscription
    await p.locator('label:has-text("Subscription")').first().click();
    await p.waitForTimeout(1000);

    // Fill price
    await p.fill("#input_price", prod.price);
    console.log("  Price done");

    // Tax category
    await p.locator('input.vs__search').first().click();
    await p.waitForTimeout(300);
    await p.locator('input.vs__search').first().fill("General");
    await p.waitForTimeout(1000);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(500);
    console.log("  Tax done");

    // Scroll up to see the buttons
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(500);

    // Click "Publish product" button
    await p.locator('button:has-text("Publish product")').click();
    await p.waitForTimeout(5000);

    const curUrl = p.url();
    console.log("  URL:", curUrl.substring(0, 100));
    const m = curUrl.match(/\/products\/(\d+)/);
    if (m) {
      ids[prod.name] = m[1];
      console.log(`  Product ID: ${m[1]}`);
    }
  }

  console.log("\n=== CREATED ===", JSON.stringify(ids, null, 2));

  // Verify via API
  const key = fs.readFileSync(".env.local","utf8").match(/LEMON_SQUEEZY_API_KEY=(.+)/m)[1].trim();
  const res = await fetch("https://api.lemonsqueezy.com/v1/products?filter[store_id]=391910", {
    headers: { Authorization: "Bearer "+key, Accept: "application/json" }
  });
  const data = await res.json();
  console.log(`\nAPI products found: ${data.data?.length || 0}`);
  for (const p of data.data || []) {
    console.log(`  ${p.id}: ${p.attributes.name} (${p.attributes.status})`);
    const v = await fetch(`https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${p.id}`, {
      headers: { Authorization: "Bearer "+key, Accept: "application/json" }
    });
    const vd = await v.json();
    for (const vt of vd.data || []) {
      const a = vt.attributes;
      console.log(`    Variant ${vt.id}: ${a.name} $${parseInt(a.price)/100}/${a.interval} (${a.status})`);
      // Save variant IDs
      if (p.attributes.name.includes("Starter")) ids._v1 = vt.id;
      if (p.attributes.name.includes("Profesional")) ids._v2 = vt.id;
      if (p.attributes.name.includes("Despacho")) ids._v3 = vt.id;
    }
  }

  // Update .env.local with product and variant IDs
  if (Object.keys(ids).length > 0) {
    let env = fs.readFileSync(".env.local", "utf8");
    const P = products;
    if (ids[P[0].name]) env = env.replace(/LS_PRODUCT_STARTER_ID=.*/gm, `LS_PRODUCT_STARTER_ID=${ids[P[0].name]}`);
    if (ids[P[1].name]) env = env.replace(/LS_PRODUCT_PROFESIONAL_ID=.*/gm, `LS_PRODUCT_PROFESIONAL_ID=${ids[P[1].name]}`);
    if (ids[P[2].name]) env = env.replace(/LS_PRODUCT_DESPACHO_ID=.*/gm, `LS_PRODUCT_DESPACHO_ID=${ids[P[2].name]}`);
    if (ids._v1) env = env.replace(/LS_VARIANT_STARTER_ID=.*/gm, `LS_VARIANT_STARTER_ID=${ids._v1}`);
    if (ids._v2) env = env.replace(/LS_VARIANT_PROFESIONAL_ID=.*/gm, `LS_VARIANT_PROFESIONAL_ID=${ids._v2}`);
    if (ids._v3) env = env.replace(/LS_VARIANT_DESPACHO_ID=.*/gm, `LS_VARIANT_DESPACHO_ID=${ids._v3}`);
    fs.writeFileSync(".env.local", env);
    console.log("\n.env.local updated with all IDs");
  }
})();
