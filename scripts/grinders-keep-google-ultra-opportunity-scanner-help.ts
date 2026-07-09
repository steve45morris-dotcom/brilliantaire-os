export function printHelp() {
  console.log(`
🛡️ Grinders Keep Google Ultra Opportunity Scanner - Help Menu

Available Commands:
  help                           Print this help menu and exit
  scan                           Scan project telemetry, map needs to manual Google tool workflows, and stage results
  report                         Compile reports/google_ultra_opportunities_YYYY-MM-DD.md
  status                         Print dashboard status of opportunity scan reports

Guardrails:
  - Automated execution of Google tools is DISABLED.
  - Outbound HTTP requests to Google services are BLOCKED.
  - External API calls are BLOCKED.
  - All mapped workflows are strictly manual instructions.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('grinders-keep-google-ultra-opportunity-scanner-help.ts')) {
  printHelp();
}
