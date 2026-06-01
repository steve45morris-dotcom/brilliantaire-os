export function printHelp() {
  console.log(`
🛠️ Maintenance Daily Check CLI - Help Menu

Available Commands:
  help             Print this help menu and exit
  status           Print current dashboard status of health and cleanup metrics
  cleanup-status   Generate reports/cleanup_status_YYYY-MM-DD.md
  registry-status  Generate reports/registry_status_YYYY-MM-DD.md
  full-report      Generate reports/maintenance_daily_check_YYYY-MM-DD.md

Guardrails:
  - Deleting quarantined files is BLOCKED.
  - unlinking or running rm commands is BLOCKED.
  - PROJECTS.md auto-mutations are BLOCKED.
  - Commands must route through the Safe Command Router.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('maintenance-check-help.ts')) {
  printHelp();
}
