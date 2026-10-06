import { COMMAND_REGISTRY } from '../config/commands.js';

function printGoogleUltraHelp() {
  console.log("=========================================");
  console.log("🚀 GRINDERS KEEP GOOGLE ULTRA OPPORTUNITY SCANNER DEEPENER - HELP");
  console.log("=========================================");
  console.log("The Google Ultra Opportunity Scanner Deepener is a dedicated module of Sentinel OS under Phase 12G.");
  console.log("It maps project needs, gaps, content concepts, and decisions to manual Google tool workflows.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero live Google tool execution or cloud uploads.");
  console.log("  2. Recommendation only: Access is treated as subscription context; zero direct API calls.");
  console.log("  3. Non-mutation: Prepares plans and scorecards; does not change source reports.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Google Ultra Opportunity Scanner Deepener:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-google-ultra-opportunity-scanner-deepener'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printGoogleUltraHelp();
