import {
  PROJECTS_MD_PATH,
  STAGED_ENTRIES_DIR,
  APPEND_GATE_ONLY
} from '../config/project-registry-append-gate.js';

export function printHelp() {
  console.log(`
🛡️ Project Registry Append Gate CLI - Help Menu

Available Commands:
  help               Print this help menu and exit
  preview            Inspect staged candidates, run safety checks, and output preview report
  append-approved    Backup current registry and append approved candidates (requires --confirm)
  status             Print console status of latest previews, backups, and logs

Configuration:
  - PROJECTS.md Path:   ${PROJECTS_MD_PATH}
  - Staged Entries Dir: ${STAGED_ENTRIES_DIR}
  - Safety Mode:        APPEND_GATE_ONLY = ${APPEND_GATE_ONLY}

Rules:
  - Overwriting PROJECTS.md is BLOCKED.
  - Appending without explicit '--confirm' flag is BLOCKED.
  - Adding duplicate project names or paths is BLOCKED.
  - Directory modifications or internal shell runs are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('project-registry-append-gate-help.ts')) {
  printHelp();
}
