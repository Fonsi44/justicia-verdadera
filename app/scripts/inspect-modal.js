const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-modal-inspect",
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
  await p.waitForTimeout(3000);

  // Click "New Product"
  await p.locator('button:has-text("New Product")').click();
  await p.waitForTimeout(3000);

  // Dump ALL HTML
  const html = await p.content();
  fs.writeFileSync("scripts/full-page-after-click.html", html);

  // Find any visible modal/drawer/popup and dump it
  const modalContent = await p.evaluate(() => {
    // Check for various modal patterns
    const selectors = [
      "[role=dialog]", "[class*=modal]", "[class*=drawer]", "[class*=slide]",
      "[class*=overlay]", "[class*=panel]", "[class*=sidebar]",
      "[data-testid*=modal]", "[data-testid*=drawer]",
      "form:not([style*='display: none'])", "[class*=fixed]",
      "[class*=absolute] [class*=bg-white]", "[class*=shadow-2xl]",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        return {
          selector: sel,
          className: el.className?.substring(0, 100),
          html: el.innerHTML?.substring(0, 10000),
          inputs: Array.from(el.querySelectorAll("input, textarea, select, label, button")).map(x => ({
            tag: x.tagName, id: x.id, name: x.getAttribute("name"),
            type: x.getAttribute("type"), placeholder: x.getAttribute("placeholder"),
            text: (x.textContent||"").trim().substring(0, 40),
            className: (x.className||"").substring(0, 40),
            visible: x.offsetParent !== null,
          }))
        };
      }
    }
    return null;
  });

  if (modalContent) {
    console.log("=== MODAL CONTENT ===");
    console.log("Selector:", modalContent.selector);
    console.log("Class:", modalContent.className);
    console.log("Inputs:", JSON.stringify(modalContent.inputs, null, 2));
    fs.writeFileSync("scripts/modal.html", modalContent.html);
  } else {
    console.log("No modal/drawer found.");
    // Dump all visible inputs on the page
    const inputs = await p.evaluate(() => {
      return Array.from(document.querySelectorAll("input, textarea, select")).filter(el => el.offsetParent !== null).map(el => ({
        tag: el.tagName, id: el.id, name: el.getAttribute("name"),
        type: el.getAttribute("type"), placeholder: el.getAttribute("placeholder"),
        value: el.value, className: (el.className||"").substring(0, 40),
        rect: {
          x: el.getBoundingClientRect().x,
          y: el.getBoundingClientRect().y,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        }
      }));
    });
    console.log("Visible inputs:", JSON.stringify(inputs, null, 2));
  }

  await p.screenshot({ path: "scripts/after-click.png", fullPage: true });
  console.log("\nBrowser open. Ctrl+C to close.");
})();
