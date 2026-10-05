import { COMMAND_REGISTRY } from '../config/commands.js';

function printGapHunterHelp() {
  console.log("=========================================");
  console.log("🔍 GRINDERS KEEP GAP HUNTER - HELP & DIRECTIVES");
  console.log("=========================================");
  console.log("The Gap Hunter is a dedicated module of Sentinel OS under Phase 12C.");
  console.log("It audits real local workspace telemetry to detect missing files, stale outputs, duplicates, and unmonetized assets.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero cloud API queries or data uploads.");
  console.log("  2. Strict Real Data Enforced: No mocked system status metrics or history allowed.");
  console.log("  3. Read-only audit scope: Strictly recommends and scores; does not delete, edit, or clean files.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Gap Hunter:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-gap-hunter'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printGapHunterHelp();
