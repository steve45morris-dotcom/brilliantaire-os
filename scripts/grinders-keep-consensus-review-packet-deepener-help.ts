import { COMMAND_REGISTRY } from '../config/commands.js';

function printConsensusHelp() {
  console.log("=========================================");
  console.log("🧠 GRINDERS KEEP CONSENSUS REVIEW PACKET DEEPENER - HELP");
  console.log("=========================================");
  console.log("The Consensus Review Packet Deepener is a dedicated module of Sentinel OS under Phase 12F.");
  console.log("It packages system questions, content ideas, build decisions, and monetization opportunities");
  console.log("into manual review packets for ChatGPT, Gemini, Claude, and NotebookLM without cloud APIs.");
  console.log("\nRules Enforced:");
  console.log("  1. Local-first only: Zero cloud API queries or external data uploads.");
  console.log("  2. Strict Real Data Enforced: No mocked system status metrics or history allowed.");
  console.log("  3. Read-only Staging: Strictly prepares prompts/packets; does not call external models.");
  console.log("  4. Command Router exact name matches required. Aliases are blocked.");
  console.log("\n📋 Registered commands for Consensus Review Packet Deepener:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-consensus-review-packet-deepener'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printConsensusHelp();
