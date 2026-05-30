const fs = require("fs");
const key = fs.readFileSync(".env.local","utf8").match(/LEMON_SQUEEZY_API_KEY=(.+)/m)[1].trim();
const h = { Authorization: "Bearer " + key, Accept: "application/json" };
(async () => {
  const r = await fetch("https://api.lemonsqueezy.com/v1/products?filter[store_id]=391910", { headers: h });
  const d = await r.json();
  for (const prod of d.data || []) {
    console.log("Product " + prod.id + ": " + prod.attributes.name + " (" + prod.attributes.status + ")");
    const vr = await fetch("https://api.lemonsqueezy.com/v1/variants?filter[product_id]=" + prod.id, { headers: h });
    const vd = await vr.json();
    for (const v of vd.data || []) {
      const a = v.attributes;
      console.log("  Variant " + v.id + ': "' + a.name + '" $' + parseInt(a.price) / 100 + "/" + a.interval + " status=" + a.status);
    }
  }
  console.log("\n.env.local:");
  const env = fs.readFileSync(".env.local","utf8").split("\n").filter(l => l.includes("LS_") || l.includes("STORE_ID"));
  env.forEach(l => console.log("  " + l.trim()));
})();
