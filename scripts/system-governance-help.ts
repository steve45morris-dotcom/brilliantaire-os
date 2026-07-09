export function printHelp() {
  console.log(`
🛡️ System Governance Engine CLI - Help Menu

Available Commands:
  help                           Print this help menu and exit
  run                            Scan architecture, detect naming drift and duplicates, update dashboard telemetry
  status                         Print dashboard status of governance validation

Guardrails:
  - Validation runs are READ-ONLY over source files.
  - Automatically appends approved decisions to DECISIONS.md.
  - Updates the Vite dashboard parameters statically.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('system-governance-help.ts')) {
  printHelp();
}
