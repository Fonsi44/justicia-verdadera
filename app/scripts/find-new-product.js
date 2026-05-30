const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-v3-" + Date.now(),
    { headless: false }
  );
  const p = await ctx.newPage();

  // Login
  await p.goto("https://auth.lemonsqueezy.com/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.fill("#email", process.env.LS_EMAIL);
  await p.fill("#password", process.env.LS_PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);

  // Go to products page
  await p.goto("https://app.lemonsqueezy.com/products", { waitUntil: "networkidle" });
  await p.waitForTimeout(3000);
  console.log("Products page URL:", p.url());
  await p.screenshot({ path: "scripts/products-page.png", fullPage: true });

  // Find ALL links/buttons on the page
  const all = await p.evaluate(() => {
    return Array.from(document.querySelectorAll("a, button, [role=button]")).map(el => ({
      tag: el.tagName,
      text: (el.textContent || "").trim().substring(0, 50),
      href: el.href || el.getAttribute("href") || "",
      id: el.id,
      class: (el.className || "").substring(0, 60),
      onclick: el.getAttribute("onclick") || "",
      "data-testid": el.getAttribute("data-testid") || "",
    })).filter(el => el.text || el.href);
  });

  console.log(`\n=== All interactive elements (${all.length}) ===`);
  for (const el of all) {
    if (el.text.toLowerCase().includes("new") || el.href.includes("new") || el.text.toLowerCase().includes("product") || el.href.includes("product")) {
      console.log(`  [${el.tag}] text="${el.text}" href="${el.href}" id="${el.id}" data-testid="${el['data-testid']}"`);
    }
  }

  // Find "New" links specifically
  console.log("\n=== Elements with 'new' ===");
  for (const el of all) {
    if (el.text.toLowerCase().includes("new") || el.href.toLowerCase().includes("new")) {
      console.log(`  [${el.tag}] text="${el.text}" href="${el.href}"`);
    }
  }
  
  console.log("\nBrowser open for inspection.");
})();
