export function printHelp() {
  console.log(`
🛡️ Pipeline Proposal Approval Router CLI - Help Menu

Available Commands:
  help                             Print this help menu and exit
  validate                         Read the latest pipeline approval package and validate recommended decision
  approve-packet                   Generate the approved implementation packet if recommendation is approve
  manual-brief                     Generate the manual execution brief outlining rules and expectations
  status                           Inspect validation, approved packet, and manual brief statuses

Guardrails:
  - Raw command execution is BLOCKED.
  - Local script execution is BLOCKED.
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
  - Automatic NEXT_ACTIONS.md writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('pipeline-approval-router-help.ts') || process.argv[1]?.endsWith('pipeline-approval-router-help.js')) {
  printHelp();
}
