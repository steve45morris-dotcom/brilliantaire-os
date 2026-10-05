import { COMMAND_REGISTRY } from '../config/commands.js';

function printExecutionApprovalQueueHelp() {
  console.log("=========================================");
  console.log("🚦 GRINDERS KEEP EXECUTION APPROVAL QUEUE - HELP");
  console.log("=========================================");
  console.log("The Execution Approval Queue takes human-approved decisions from Phase 12I and");
  console.log("converts them into safe, exact-name, non-destructive execution tickets without running them automatically.");
  console.log("\nRules Enforced:");
  console.log("  1. Staging only: Generates execution tickets; does not execute any command.");
  console.log("  2. Local-first only: Zero live model calls, Google API pushes, or publishing.");
  console.log("  3. Real data audit: Demands validated decision files from decision_synthesis/.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Execution Approval Queue:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-execution-approval-queue'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printExecutionApprovalQueueHelp();
