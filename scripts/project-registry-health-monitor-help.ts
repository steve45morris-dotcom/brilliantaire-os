import {
  PROJECTS_MD_PATH,
  HEALTH_MONITOR_ONLY,
  QUARANTINE_DIR
} from '../config/project-registry-health-monitor.js';

export function printHelp() {
  console.log(`
🩺 Project Registry Health Monitor CLI - Help Menu

Available Commands:
  help                 Print this help menu and exit
  verify-projects      Audit PROJECTS.md structure, format, names, and paths for duplicates
  skipped-candidates   Review candidates skipped by the append gate and suggest next actions
  quarantine-status    Monitor quarantined file counts, checksum validations, and elapsed time
  health-report        Generate a unified markdown health report summarizing all audits
  status               Print console dashboard summarizing latest check statuses

Configuration:
  - PROJECTS.md Path:   ${PROJECTS_MD_PATH}
  - Quarantine Dir:    ${QUARANTINE_DIR}
  - Safety Mode:        HEALTH_MONITOR_ONLY = ${HEALTH_MONITOR_ONLY}

Guardrails:
  - Modifying PROJECTS.md table rows is BLOCKED.
  - Deleting quarantined files or database logs is BLOCKED.
  - Moving project folders or running internal tests is BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('project-registry-health-monitor-help.ts')) {
  printHelp();
}
