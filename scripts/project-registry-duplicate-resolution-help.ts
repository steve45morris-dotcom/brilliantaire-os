import {
  PROJECTS_MD_PATH,
  DUPLICATE_RESOLUTION_ONLY
} from '../config/project-registry-duplicate-resolution.js';

export function printHelp() {
  console.log(`
🛠️ Project Registry Duplicate Resolution Gate CLI - Help Menu

Available Commands:
  help                 Print this help menu and exit
  scan                 Scan PROJECTS.md and latest integrity check for duplicate name/path entries
  stage-resolution     Analyze duplicate scan report and stage resolution recommendations
  apply-approved       Backup registry and apply staged resolutions (requires --confirm)
  status               Print status dashboard of scans, plans, backups, and logs

Configuration:
  - PROJECTS.md Path:   ${PROJECTS_MD_PATH}
  - Security Switch:    DUPLICATE_RESOLUTION_ONLY = ${DUPLICATE_RESOLUTION_ONLY}

Guardrails:
  - Deleting project folders or moving directories is BLOCKED.
  - Modifying PROJECTS.md without the explicit '--confirm' flag is BLOCKED.
  - Overwriting PROJECTS.md without creating a timestamped backup first is BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('project-registry-duplicate-resolution-help.ts')) {
  printHelp();
}
