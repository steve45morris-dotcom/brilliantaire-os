import { COMMAND_REGISTRY } from '../config/commands.js';

function printPostLaunchHelp() {
  console.log("=========================================");
  console.log("🏁 GRINDERS KEEP POST-LAUNCH REVIEW LEDGER - HELP");
  console.log("=========================================");
  console.log("This module processes and audits manual execution records post-launch,");
  console.log("verifying outcomes, discovering manual commands, screenshots, and logs,");
  console.log("and generating ledger reports and telemetry.");
  console.log("\nCore Rules Enforced:");
  console.log("  1. Local-First: Zero automatic command execution, external API calls, uploads, or publishing.");
  console.log("  2. No Inventions: Strict real data scanning. If no execution records exist, compiles ledger status showing no records found.");
  console.log("  3. Verification Discipline: Verification is based strictly on physical file presence and metadata validation.");
  console.log("\n📋 Registered commands for Post-Launch Review Ledger:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-post-launch-review-ledger'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printPostLaunchHelp();
