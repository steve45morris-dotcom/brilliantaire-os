import { COMMAND_REGISTRY } from '../config/commands.js';

function printAdaptiveDeepenerHelp() {
  console.log("=========================================");
  console.log("🧠 GRINDERS KEEP ADAPTIVE LEARNING DEEPENER - HELP");
  console.log("=========================================");
  console.log("The Adaptive Learning Deepener is a dedicated module of Sentinel OS under Phase 12D.");
  console.log("It compares repeated Gap Hunter results, analyzes behavior signals, recommends habits, and stages system adjustments.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero cloud API queries or external data uploads.");
  console.log("  2. Strict Real Data Enforced: No mocked system status metrics or history allowed.");
  console.log("  3. Read-only R&D audit: Does not delete, modify, or auto-apply fixes.");
  console.log("  4. Command Router exact name match required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Adaptive Learning Deepener:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-adaptive-learning-deepener'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printAdaptiveDeepenerHelp();
