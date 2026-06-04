export function printHelp() {
  console.log(`
🛡️ Manual Implementation Packet Compiler CLI - Help Menu

Available Commands:
  help                             Print this help menu and exit
  compile-prompt                   Combine latest approved packet & template into final manual build prompt
  checklist                        Generate implementation compliance checklist YYYY-MM-DD
  safety-review                    Generate boundary safety audit report YYYY-MM-DD
  handoff                          Package prompt, checklist, & safety review into a final handoff report
  status                           Inspect active manual implementation documents and readiness state

Guardrails:
  - Raw command execution is BLOCKED.
  - Local script execution is BLOCKED.
  - External API calls are BLOCKED.
  - Automatic Obsidian writes are BLOCKED.
  - Automatic NEXT_ACTIONS.md writes are BLOCKED.
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('manual-implementation-packet-help.ts') || process.argv[1]?.endsWith('manual-implementation-packet-help.js')) {
  printHelp();
}
