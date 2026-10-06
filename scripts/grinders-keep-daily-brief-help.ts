import { COMMAND_REGISTRY } from '../config/commands.js';

function printGrindersKeepHelp() {
  console.log("=========================================");
  console.log("🔥 GRINDERS KEEP CREATIVE ENGINE - HELP & COMMANDS");
  console.log("=========================================");
  console.log("Grinders Keep is the Creative Intelligence & Invention Engine of Sentinel OS.");
  console.log("Rules Enforced:");
  console.log("  1. No Hype Rule: Every build suggestion includes one reason not to build it yet.");
  console.log("  2. Kill List Rule: Every brief has one feature/build direction to pause/archive/block/delete.");
  console.log("  3. Smallest Useful Version: Always outlines the MVP version.");
  console.log("  4. Money Confidence Score: Includes score (1-10) and reason for monetization path.");
  console.log("  5. Commander Approval Required: Strictly no auto-execution or auto-builds without approval.");
  console.log("  6. Evidence-Aware: Cites source files or lists them as missing with confidence scores.");
  console.log("\n📋 Registered Grinders Keep Commands:");

  const gkCommands = COMMAND_REGISTRY.filter(cmd => cmd.name.startsWith('grinders-keep'));

  for (const cmd of gkCommands) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
    console.log(`   Exact Name:   ${cmd.requiresExactName ? 'REQUIRED (Aliases forbidden)' : 'NO'}`);
  }

  console.log("\n=========================================");
}

printGrindersKeepHelp();
