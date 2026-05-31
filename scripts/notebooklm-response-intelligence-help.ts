function printHelp() {
  console.log("=========================================");
  console.log("🧠 NOTEBOOKLM RESPONSE INTELLIGENCE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-response-intelligence -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  process-latest   Parse latest response file into an Insight Index report");
  console.log("  citation-map     Extract and map citations from latest response file");
  console.log("  weak-claims      Evaluate weak/unproven claims and suggest verification steps");
  console.log("  workflow-cards   Convert actionable steps into structured workflow cards");
  console.log("  os-modules       Identify suggestions for Brilliantaire OS modules");
  console.log("  obsidian-note    Compile a unified staged Obsidian note ready for review");
  console.log("  full             Run all processors sequentially");
  console.log("  status           Print processor file path status summaries");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-response-intelligence -- \"help\"");
  console.log("  npm run notebooklm-response-intelligence -- \"process-latest\"");
  console.log("  npm run notebooklm-response-intelligence -- \"full\"");
  console.log("  npm run notebooklm-response-intelligence -- \"status\"");
  console.log("=========================================");
}

printHelp();
