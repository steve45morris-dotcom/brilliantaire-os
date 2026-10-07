import { COMMAND_REGISTRY } from '../config/commands.js';

function printDownstreamFeedRouterHelp() {
  console.log("=========================================");
  console.log("🏁 GRINDERS KEEP DOWNSTREAM FEED ROUTER - HELP");
  console.log("=========================================");
  console.log("This module discovers validated evidence from Phase 12O and");
  console.log("stages routing configurations for downstream target phases");
  console.log("such as Manual Review, Decision Synthesis, Continuous Improvement,");
  console.log("or Launch Readiness without moving files or executing actions.");
  console.log("\nCore Safety Rules Enforced:");
  console.log("  1. Staged Only: Zero file moving, copying, renaming or deletion.");
  console.log("  2. Local-First: No external API requests or Google tool execution.");
  console.log("  3. Safety Locked: auto_route_allowed is always false; all routing requires human/Commander approval.");
  console.log("\n📋 Registered commands for Downstream Feed Router:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-downstream-feed-router'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printDownstreamFeedRouterHelp();
