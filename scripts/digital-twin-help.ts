export function printHelp() {
  console.log(`
♊ Brilliantaire OS Digital Twin CLI - Help Menu

Available Commands:
  help                           Print this help menu and exit
  simulate                       Run read-only simulation on current uncommitted changes
  report                         Print the latest staged simulation report details

Simulation Scoring Matrix:
  - 95 to 100: APPROVED (Safe to Merge)
  - 85 to 94: ACCEPTABLE (With Minor Review)
  - 70 to 84: REVISION REQUIRED (Review dependencies)
  - Below 70: REJECTED (Critical blocker breached)
`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('digital-twin-help.ts')) {
  printHelp();
}
