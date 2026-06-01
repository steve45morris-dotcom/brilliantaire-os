import {
  MINIMUM_MONITORING_DAYS,
  READINESS_ONLY
} from '../config/quarantine-deletion-readiness.js';

export function printHelp() {
  console.log(`
🩺 Quarantine Deletion Readiness Staging Gate CLI - Help Menu

Available Commands:
  help                 Print this help menu and exit
  scan                 Audit quarantine dir, manifest, logs, and checksum reports
  restore-check        Audit restore script presence and file coverage (no execution)
  age-check            Calculate elapsed quarantine monitoring period age
  readiness-report     Compile unified deletion readiness status report
  future-checklist     Generate pre-deletion verification checklist
  status               Print summary console dashboard of current gate metrics

Configuration:
  - Minimum Age Required:  ${MINIMUM_MONITORING_DAYS} days
  - Safety Mode:           READINESS_ONLY = ${READINESS_ONLY}

Guardrails:
  - Deleting quarantined duplicate files is BLOCKED.
  - unlinking or running rm commands is BLOCKED.
  - PROJECTS.md modifications are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('quarantine-deletion-readiness-help.ts')) {
  printHelp();
}
