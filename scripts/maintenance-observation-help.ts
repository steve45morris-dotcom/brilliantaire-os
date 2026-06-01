export function printHelp() {
  console.log(`
🛡️ Continued Maintenance Observation CLI - Help Menu

Available Commands:
  help                Print this help menu and exit
  snapshot            Generate outputs/maintenance/observation/snapshots/maintenance_observation_snapshot_YYYY-MM-DD.md
  countdown           Generate outputs/maintenance/observation/reports/quarantine_countdown_status_YYYY-MM-DD.md
  observation-report  Generate outputs/maintenance/observation/reports/maintenance_observation_report_YYYY-MM-DD.md
  expiration-watch    Generate outputs/maintenance/observation/reports/quarantine_expiration_watch_YYYY-MM-DD.md
  status              Print dashboard status of observation snapshots and countdowns

Guardrails:
  - Deleting quarantined files is BLOCKED.
  - unlinking or running rm commands is BLOCKED.
  - PROJECTS.md auto-mutations are BLOCKED.
  - Deletion remains disabled during the observation period.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('maintenance-observation-help.ts')) {
  printHelp();
}
