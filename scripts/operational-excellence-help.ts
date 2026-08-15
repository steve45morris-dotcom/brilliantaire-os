export function printHelp() {
  console.log(`
📈 Brilliantaire OS Operational Excellence CLI - Help Menu

Available Commands:
  help                           Print this help menu and exit
  run                            Trigger validation engines, compile Platform Health Index, prioritize backlog, and stage executive briefings

Platform Health Index Weights:
  - Architecture: 15%            - Operations: 15%
  - Governance: 15%              - Observability: 15%
  - Certification: 10%           - Production Readiness: 15%
  - Security: 15%
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('operational-excellence-help.ts')) {
  printHelp();
}
