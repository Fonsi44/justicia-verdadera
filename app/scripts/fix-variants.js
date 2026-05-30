const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-fix-variants",
    { headless: false }
  );
  const p = await ctx.newPage();

  await p.goto("https://auth.lemonsqueezy.com/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.fill("#email", process.env.LS_EMAIL);
  await p.fill("#password", process.env.LS_PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);

  const toFix = [
    { pid: "1100144", name: "Starter Mensual", price: "29.00" },
    { pid: "1100147", name: "Profesional Mensual", price: "79.00" },
    { pid: "1100148", name: "Despacho Mensual", price: "199.00" },
  ];

  const variantIds = {};

  for (const prod of toFix) {
    console.log(`\n=== Fixing product ${prod.pid}: ${prod.name} ===`);

    // Go to the product page
    await p.goto(`https://app.lemonsqueezy.com/products/${prod.pid}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(3000);

    // Look for the variant to edit - click on it
    await p.screenshot({ path: `scripts/product-${prod.pid}-page.png`, fullPage: true });

    // Find variant by clicking the "Default" link or the variant card
    const variantLink = p.locator('a:has-text("Default"), a[href*="variants"]').first();
    if (await variantLink.isVisible().catch(() => false)) {
      await variantLink.click();
      await p.waitForTimeout(3000);
      console.log("  Clicked variant link");
    }

    await p.screenshot({ path: `scripts/variant-${prod.pid}-page.png`, fullPage: true });
    const currentUrl = p.url();
    console.log("  Variant URL:", currentUrl.substring(0, 100));

    // Get variant ID from URL
    const vm = currentUrl.match(/\/variants\/(\d+)/);
    if (vm) {
      variantIds[prod.pid] = vm[1];
      console.log(`  Variant ID: ${vm[1]}`);
    }

    // Look for name input and rename
    const nameInput = p.locator('input[id="name"], input[name="name"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.click();
      await nameInput.fill(prod.name);
      console.log("  Name updated");
    }

    // Look for price input
    const priceInput = p.locator('#input_price, input[name="price"], input[type="number"]').first();
    if (await priceInput.isVisible().catch(() => false)) {
      await priceInput.click();
      await priceInput.fill(prod.price);
      console.log("  Price updated");
    }

    // Look for interval dropdown - find monthly option
    // First try to find a select or dropdown for billing interval
    await p.waitForTimeout(500);

    // Click the billing interval selector - look for Yearly/Monthly toggle
    const monthlyLabel = p.locator('label:has-text("Monthly"), label:has-text("month")').first();
    if (await monthlyLabel.isVisible().catch(() => false)) {
      await monthlyLabel.click();
      await p.waitForTimeout(500);
      console.log("  Changed to Monthly");
    } else {
      // Try radio buttons or dropdown
      const yearlyLabel = p.locator('label:has-text("Yearly")').first();
      if (await yearlyLabel.isVisible().catch(() => false)) {
        // Click nearby the monthly option
        const allInterval = await p.locator('input[type="radio"]').all();
        for (const radio of allInterval) {
          const radioId = await radio.getAttribute("id");
          if (radioId) {
            const label = p.locator(`label[for="${radioId}"]`);
            const labelText = await label.innerText().catch(() => "");
            if (labelText.toLowerCase().includes("month")) {
              await radio.click({ force: true });
              await p.waitForTimeout(500);
              console.log("  Monthly radio selected");
              break;
            }
          }
        }
      }
    }

    // Save
    const saveBtn = p.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await p.waitForTimeout(5000);
      console.log("  Saved");
    }

    await p.screenshot({ path: `scripts/variant-${prod.pid}-saved.png`, fullPage: true });
  }

  console.log("\n=== Variant IDs ===", JSON.stringify(variantIds, null, 2));

  // Update .env.local with variants
  let env = fs.readFileSync(".env.local", "utf8");
  if (variantIds["1100144"]) env = env.replace(/LS_VARIANT_STARTER_ID=.*/gm, `LS_VARIANT_STARTER_ID=${variantIds["1100144"]}`);
  if (variantIds["1100147"]) env = env.replace(/LS_VARIANT_PROFESIONAL_ID=.*/gm, `LS_VARIANT_PROFESIONAL_ID=${variantIds["1100147"]}`);
  if (variantIds["1100148"]) env = env.replace(/LS_VARIANT_DESPACHO_ID=.*/gm, `LS_VARIANT_DESPACHO_ID=${variantIds["1100148"]}`);
  fs.writeFileSync(".env.local", env);
  console.log(".env.local updated");
})();
