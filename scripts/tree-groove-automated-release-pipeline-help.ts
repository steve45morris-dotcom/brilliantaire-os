import { COMMAND_REGISTRY } from '../config/commands.js';

function printPipelineHelp() {
  console.log("=========================================");
  console.log("🛰️ TREE GROOVE RECORDS AUTOMATED RELEASE PIPELINE - HELP & DIRECTIVES");
  console.log("=========================================");
  console.log("This pipeline coordinates automated checks, preflight verification mapping, and packages staging.");
  console.log("It compiles chronological runbooks and checklists without automated publishing hooks.");
  console.log("\nRules Enforced:");
  console.log("  1. Strict Manual Gate: Zero automated API publishes or data posting to live channels.");
  console.log("  2. Readiness Threshold: Requires average verification score of 90/100 to proceed.");
  console.log("  3. Whitelisted URLs: Ensures CTAs map exactly to whitelist links.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Release Pipeline:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('tree-groove-automated-release-pipeline'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printPipelineHelp();
