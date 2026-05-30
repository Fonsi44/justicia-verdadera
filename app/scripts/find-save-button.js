const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-find-save",
    { headless: false }
  );
  const p = await ctx.newPage();

  await p.goto("https://auth.lemonsqueezy.com/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.fill("#email", process.env.LS_EMAIL);
  await p.fill("#password", process.env.LS_PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);

  await p.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.locator('button:has-text("New Product")').click();
  await p.waitForTimeout(2000);

  // Fill name
  await p.fill("#input_name", "Test Product");
  // Select subscription
  await p.locator('label:has-text("Subscription")').first().click();
  await p.waitForTimeout(1000);
  await p.fill("#input_price", "29");
  await p.waitForTimeout(500);
  await p.locator('input.vs__search').first().click();
  await p.waitForTimeout(500);
  await p.locator('input.vs__search').first().fill("General");
  await p.waitForTimeout(800);
  await p.keyboard.press("Enter");
  await p.waitForTimeout(500);

  // Dump ALL buttons to find the real Save button
  const btns = await p.evaluate(() => {
    return Array.from(document.querySelectorAll("button")).map(b => ({
      text: (b.textContent||"").trim().substring(0, 30),
      type: b.getAttribute("type") || "",
      id: b.id,
      class: (b.className||"").substring(0, 60),
      disabled: b.disabled,
      visible: b.offsetParent !== null,
      rect: {
        x: Math.round(b.getBoundingClientRect().x),
        y: Math.round(b.getBoundingClientRect().y),
        w: Math.round(b.getBoundingClientRect().width),
        h: Math.round(b.getBoundingClientRect().height),
      }
    }));
  });

  console.log("\n=== ALL BUTTONS ===");
  btns.forEach((b, i) => {
    if (b.visible) console.log(`  [${i}] "${b.text}" type=${b.type} id=${b.id} class=${b.class} disabled=${b.disabled} pos=(${b.rect.x},${b.rect.y}) ${b.rect.w}x${b.rect.h}`);
  });

  // Also check for submit-type buttons
  console.log("\n=== SUBMIT BUTTONS ===");
  btns.filter(b => b.visible && (b.type === "submit" || b.text.toLowerCase().includes("save") || b.text.toLowerCase().includes("create") || b.text.toLowerCase().includes("publish"))).forEach(b => {
    console.log(`  "${b.text}" type=${b.type} id=${b.id}`);
  });

  await p.screenshot({ path: "scripts/final-save-buttons.png", fullPage: true });
  console.log("\nBrowser open.");
})();
