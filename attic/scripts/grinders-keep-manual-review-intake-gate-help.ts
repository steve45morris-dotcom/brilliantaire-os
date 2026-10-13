import { COMMAND_REGISTRY } from '../config/commands.js';

function printIntakeGateHelp() {
  console.log("=========================================");
  console.log("📥 GRINDERS KEEP MANUAL REVIEW INTAKE GATE - HELP");
  console.log("=========================================");
  console.log("The Manual Review Intake Gate parses manually pasted responses from ChatGPT, Gemini,");
  console.log("Claude, NotebookLM, and Google Ultra manual workflows.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: No external API calls, model queries, or email publishing.");
  console.log("  2. Metadata validation: Scans for expected metadata fields and scores files accordingly.");
  console.log("  3. Real data audit: Only reads files located in inputs/grinders_keep/manual_reviews/.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Manual Review Intake Gate:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-manual-review-intake-gate'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printIntakeGateHelp();
