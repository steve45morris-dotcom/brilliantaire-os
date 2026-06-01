import {
  MINIMUM_MONITORING_DAYS,
  MONITORING_ONLY
} from '../config/quarantine-monitoring.js';

export function printHelp() {
  console.log(`
🩺 Quarantine Monitoring Continuation CLI - Help Menu

Available Commands:
  help                 Print this help menu and exit
  snapshot             Capture current quarantine dir, manifest, and validation state snapshot
  continuation-report  Update elapsed quarantine tracking age and calculate remaining days
  pruning-block        Document safety block parameters preventing premature deletion
  next-check           Print command instruction details for the next manual check run
  status               Print status dashboard of all monitoring metrics

Configuration:
  - Minimum Age Required:  ${MINIMUM_MONITORING_DAYS} days
  - Safety Mode:           MONITORING_ONLY = ${MONITORING_ONLY}

Guardrails:
  - Deleting quarantined duplicate files is BLOCKED.
  - unlinking or running rm commands is BLOCKED.
  - PROJECTS.md modifications are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('quarantine-monitoring-help.ts')) {
  printHelp();
}
