const { chromium } = require("playwright");

(async () => {
  const ctx = await chromium.launchPersistentContext(
    "C:\\Users\\Admin\\AppData\\Local\\Temp\\ls-dashboard-open",
    { headless: false }
  );
  const p = await ctx.newPage();

  await p.goto("https://auth.lemonsqueezy.com/login", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.fill("#email", process.env.LS_EMAIL);
  await p.fill("#password", process.env.LS_PASSWORD);
  await p.click('button[type="submit"]');
  await p.waitForTimeout(5000);

  // Open the first variant directly
  await p.goto("https://app.lemonsqueezy.com/variants/1723068", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);

  console.log("\n=== Dashboard abierto en el primer variant ===");
  console.log("Browser abierto. Puedes editar los variants manualmente.");
})();
