export function printHelp() {
  console.log(`
🛡️ Pipeline Integration Stage Gate CLI - Help Menu

Available Commands:
  help                             Print this help menu and exit
  proposal                         Staged build proposal from top workflow recommendation
  dependency-map                   Generate dependency checklist for target system
  agent-map                        Map productivity agent roles and review responsibilities
  implementation-prompt            Stage full implementation context and code instructions
  approval-package                 Package all reports into manual approval checkbook
  status                           Inspect active stage gate artifacts and readiness state

Guardrails:
  - Raw command execution is BLOCKED.
  - Local script execution is BLOCKED.
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
  - Automatic NEXT_ACTIONS.md writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('pipeline-stage-gate-help.ts')) {
  printHelp();
}
