import { COMMAND_REGISTRY } from '../config/commands.js';

function printFinalLaunchHelp() {
  console.log("=========================================");
  console.log("🏁 GRINDERS KEEP FINAL HUMAN LAUNCH SWITCH - HELP");
  console.log("=========================================");
  console.log("This module validates launch eligibility of execution tickets from Phase 12J,");
  console.log("marks eligible ones as ready for manual execution, and compiles manual command sheets.");
  console.log("\nCore Rules Enforced:");
  console.log("  1. Local-First: Zero automatic command execution, external API calls, uploads, or publishing.");
  console.log("  2. Double-Check Gate: Human review checklists and manual command sheets must be explicitly compiled.");
  console.log("  3. No Inventions: Strict real data scanning. Mock files are rejected.");
  console.log("\n📋 Registered commands for Final Human Launch Switch:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-final-human-launch-switch'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printFinalLaunchHelp();
