const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-final-" + Date.now(),
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

  // Click ALL possible new-product links
  const clicks = await p.evaluate(() => {
    const results = [];
    document.querySelectorAll("a").forEach(a => {
      if (a.textContent.toLowerCase().includes("new") || a.href.includes("/new")) {
        results.push({ text: a.textContent.trim(), href: a.href });
      }
    });
    return results;
  });
  console.log("New product links found:", clicks);
  for (const c of clicks) {
    console.log(`  "${c.text}" -> ${c.href}`);
  }

  // If we found new product links, navigate directly
  if (clicks.length > 0) {
    await p.goto(clicks[0].href, { waitUntil: "networkidle" });
    await p.waitForTimeout(3000);
  } else {
    await p.goto("https://app.lemonsqueezy.com/products/new", { waitUntil: "networkidle", timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(3000);
  }

  // DUMP ENTIRE DOM for analysis
  const dom = await p.evaluate(() => {
    function walk(el, depth = 0) {
      if (depth > 4) return [];
      const results = [];
      for (const child of el.children) {
        const tag = child.tagName.toLowerCase();
        const id = child.id ? `#${child.id}` : "";
        const cls = child.className ? `.${child.className.split(" ").filter(c=>c).join(".")}` : "";
        const text = (child.textContent || "").trim().substring(0, 40);
        if (["input","textarea","select","button","label","a","form","h1","h2","h3"].includes(tag) || child.children.length === 0 && text) {
          results.push(`${"  ".repeat(depth)}<${tag}${id}${cls}> ${text ? `"${text}"` : ""}`);
        }
        results.push(...walk(child, depth + 1));
      }
      return results;
    }
    return walk(document.body);
  });

  console.log("\n=== DOM STRUCTURE ===\n" + dom.slice(0,100).join("\n"));

  const form = await p.evaluate(() => {
    const inputs = document.querySelectorAll("input, textarea, select");
    return Array.from(inputs).map(el => ({
      tag: el.tagName,
      id: el.id,
      name: el.getAttribute("name"),
      type: el.getAttribute("type"),
      placeholder: el.getAttribute("placeholder"),
      value: el.value,
      visible: el.offsetParent !== null,
    })).filter(el => el.visible && el.type !== "hidden");
  });
  console.log("\n=== VISIBLE FORM INPUTS ===", JSON.stringify(form, null, 2));

  await p.screenshot({ path: "scripts/final-form.png", fullPage: true });

  // Now try to create the first product
  console.log("\n=== Creating Starter Plan ===");
  
  // Find the right input for name and fill it
  if (form.length > 0) {
    const nameInput = form.find(f => f.type === "text" || f.name?.includes("name") || f.id?.includes("name"));
    if (nameInput) {
      const selector = nameInput.id ? `#${nameInput.id}` : `[name="${nameInput.name}"]`;
      await p.fill(selector, "Justicia Verdadera - Starter");
      console.log(`Filled name in ${selector}`);
    } else if (form[0].type !== "number") {
      const sel = form[0].id ? `#${form[0].id}` : `[name="${form[0].name}"]`;
      await p.fill(sel, "Justicia Verdadera - Starter");
      console.log(`Filled name in ${sel} (first non-number)`);
    }

    // Fill price
    const priceInput = form.find(f => f.type === "number");
    if (priceInput) {
      const sel = priceInput.id ? `#${priceInput.id}` : `[name="${priceInput.name}"]`;
      await p.fill(sel, "29");
      console.log(`Filled price in ${sel}`);
    }
  }

  await p.screenshot({ path: "scripts/final-form-filled.png", fullPage: true });
  console.log("\nBrowser stays open. Inspect and I'll continue.");
})();
