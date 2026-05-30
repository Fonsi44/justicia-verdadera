const BASE_URL = process.env.HEALTH_URL || "http://localhost:3000";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

function ok(msg: string) {
  console.log(`${GREEN}  \u2705 ${msg}${RESET}`);
}

function fail(msg: string) {
  console.log(`${RED}  \u274c ${msg}${RESET}`);
}

function warn(msg: string) {
  console.log(`${YELLOW}  \u26a0\ufe0f ${msg}${RESET}`);
}

async function main() {
  console.log(`\n${BOLD}${CYAN}=== Justicia Verdadera \u2014 Health Check ===${RESET}\n`);

  let allHealthy = true;

  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    console.log(`${BOLD}Health endpoint:${RESET}`);
    if (res.ok) {
      ok(`Status: ${data.status} (HTTP ${res.status})`);
    } else {
      fail(`Status: ${data.status} (HTTP ${res.status})`);
      allHealthy = false;
    }
    console.log(`  Timestamp: ${data.timestamp}`);
    for (const [key, value] of Object.entries(data.checks as Record<string, string>)) {
      const icon = value === "ok" || value === "configured" ? "\u2705" : "\u274c";
      console.log(`  ${icon} ${key}: ${value}`);
      if (value !== "ok" && value !== "configured") allHealthy = false;
    }
  } catch {
    fail(`Cannot reach ${BASE_URL}/api/health`);
    allHealthy = false;
  }

  console.log();

  try {
    const res = await fetch(`${BASE_URL}/api/health/detailed`);
    const data = await res.json();
    console.log(`${BOLD}Detailed health:${RESET}`);
    if (res.ok) {
      ok(`HTTP ${res.status}`);
    } else {
      warn(`HTTP ${res.status}`);
    }
    console.log(`  Node: ${data.version}`);
    console.log(`  Uptime: ${data.uptime}s`);
    console.log(`  Memory: ${Math.round(data.memory.heapUsed / 1024 / 1024)}MB heap used`);
    console.log(`  DB tables: ${data.database.tableCount}`);
    for (const [key, value] of Object.entries(data.services as Record<string, string>)) {
      const icon = value === "configured" ? "\u2705" : value === "not_configured" ? "\u2b1c" : "\u274c";
      console.log(`  ${icon} ${key}: ${value}`);
      if (value === "error") allHealthy = false;
    }
  } catch {
    fail(`Cannot reach ${BASE_URL}/api/health/detailed`);
    allHealthy = false;
  }

  console.log();

  if (allHealthy) {
    console.log(`${GREEN}${BOLD}\u2705 All checks passed${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}${BOLD}\u274c Some checks failed${RESET}\n`);
    process.exit(1);
  }
}

main();
