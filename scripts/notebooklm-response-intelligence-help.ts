// scripts/notebooklm-response-intelligence-help.ts
// Prints available commands for response intelligence processor.

function printHelp() {
  console.log("=========================================");
  console.log("🧠 NOTEBOOKLM RESPONSE INTELLIGENCE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-response-intelligence -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                   Print this help guide");
  console.log("  citation-map           Generate citation map from latest response");
  console.log("  workflows              Extract workflows from latest response");
  console.log("  weak-claims            Evaluate weak claims and verification actions");
  console.log("  module-recommendations Suggest expansion modules for Brilliantaire OS");
  console.log("  prompt-packs           Generate prompt pack ideas for workflows");
  console.log("  obsidian-note          Compile staged Obsidian note");
  console.log("  summary                Generate response intelligence summary");
  console.log("  all                    Run all processors sequentially");
  console.log("  status                 Print latest status report");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-response-intelligence -- \"help\"");
  console.log("  npm run notebooklm-response-intelligence -- \"citation-map\"");
  console.log("  npm run notebooklm-response-intelligence -- \"all\"");
  console.log("  npm run notebooklm-response-intelligence -- \"status\"");
  console.log("=========================================");
}

printHelp();
