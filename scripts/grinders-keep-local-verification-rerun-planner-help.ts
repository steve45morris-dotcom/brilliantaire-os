import { COMMAND_REGISTRY } from '../config/commands.js';

function printRerunPlannerHelp() {
  console.log("=========================================");
  console.log("🛠️ GRINDERS KEEP LOCAL VERIFICATION RERUN PLANNER - HELP & DIRECTIVES");
  console.log("=========================================");
  console.log("The Local Verification Rerun Planner is a dedicated module under Phase 13J.");
  console.log("It compiles manual rerun instructions for the evidence verification workflow after manual completion.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero cloud API queries or data uploads.");
  console.log("  2. Strict Real Data Enforced: No mocked system status metrics or history allowed.");
  console.log("  3. Non-destructive safety checks: Compiles sequences and scorecards without automated script executions, copying, moving, or importing files.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Rerun Planner:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-local-verification-rerun-planner'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printRerunPlannerHelp();
