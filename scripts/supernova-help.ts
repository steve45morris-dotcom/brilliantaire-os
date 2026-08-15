export function printHelp() {
  console.log(`
🌌 Supernova Executive Intelligence CLI - Help Menu

Available Commands:
  help                           Print this help menu and exit
  run                            Evaluate platform state, rank strategic priorities, and output briefings

Operating Modes Configured:
  - Development                  Relaxed validation, fast execution
  - Certification (Active)       Full Governance, Digital Twin, Certifier gates
  - Production                   Strict quality checks, maximum stability
  - Recovery                     Minimal services, fault isolation assistance
  - Learning                     Extract successful patterns to workflows
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('supernova-help.ts')) {
  printHelp();
}
