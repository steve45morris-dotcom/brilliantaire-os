import { COMMAND_REGISTRY } from '../config/commands.js';

function printSynthesisGateHelp() {
  console.log("=========================================");
  console.log("🧠 GRINDERS KEEP DECISION SYNTHESIS GATE - HELP");
  console.log("=========================================");
  console.log("The Decision Synthesis Gate compiles manually validated reviews into structured");
  console.log("decision options, build and content checklists, and monetization experiments.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero live model calls, Google API pushes, or publishing.");
  console.log("  2. Synthesis only: Compiles approval lists; does not execute approvals automatically.");
  console.log("  3. Real data audit: Demands validated review files from manual_review_intake/.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Decision Synthesis Gate:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-decision-synthesis-gate'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printSynthesisGateHelp();
