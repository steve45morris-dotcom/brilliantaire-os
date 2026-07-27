export function printHelp(): void {
  console.log(`
Usage: npx tsx scripts/orchestrator-cli.ts <command>

Commands:
  audit           Run Phase 0 (snapshot) -> Phase 1 (Auditor) -> Phase 2 (reconciliation)
  gate <runDir>   Run Phase 3 — interactive Commander approval gate for the given run

Builder, Verifier, and Publisher (Phases 4-7) are not implemented yet.
`);
}
