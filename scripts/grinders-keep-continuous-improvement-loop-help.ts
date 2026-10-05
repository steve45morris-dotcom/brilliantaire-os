import { COMMAND_REGISTRY } from '../config/commands.js';

function printContinuousImprovementHelp() {
  console.log("=========================================");
  console.log("🏁 GRINDERS KEEP CONTINUOUS IMPROVEMENT LOOP - HELP");
  console.log("=========================================");
  console.log("This module processes and analyzes post-launch telemetry, recurring blockers,");
  console.log("and signals to recommend process upgrades without executing them automatically.");
  console.log("\nCore Rules Enforced:");
  console.log("  1. Local-First: Zero automatic command execution, external API calls, uploads, or publishing.");
  console.log("  2. No Inventions: Strict real data scanning. Only proposes upgrades based on actual observed data/telemetry.");
  console.log("  3. Non-mutating: Generates recommendations only; does not apply any changes to target code/workspace.");
  console.log("\n📋 Registered commands for Continuous Improvement Loop:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-continuous-improvement-loop'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printContinuousImprovementHelp();
