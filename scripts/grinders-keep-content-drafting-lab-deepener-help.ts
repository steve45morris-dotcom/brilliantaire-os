import { COMMAND_REGISTRY } from '../config/commands.js';

function printContentLabHelp() {
  console.log("=========================================");
  console.log("🎨 GRINDERS KEEP CONTENT DRAFTING LAB DEEPENER - HELP");
  console.log("=========================================");
  console.log("The Content Drafting Lab Deepener is a dedicated module of Sentinel OS under Phase 12E.");
  console.log("It extracts telemetry signals and drafts review-ready content ideas, posts, video scripts, captions, and offers.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero cloud API queries or external data uploads.");
  console.log("  2. Strict Real Data Enforced: No mocked system status metrics or history allowed.");
  console.log("  3. Read-only Drafting: Strictly recommeds and drafts; does not post, publish, send, or upload.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Content Lab Deepener:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-content-drafting-lab-deepener'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printContentLabHelp();
