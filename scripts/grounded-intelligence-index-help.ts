// scripts/grounded-intelligence-index-help.ts
// Prints usage and available subcommands for grounded index graph processor.

function printHelp() {
  console.log("=========================================");
  console.log("🕸️ GROUNDED INTELLIGENCE INDEX GRAPH HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-grounded-index-graph -- <command> [options]");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  build            Compile response intelligence files into JSON & Markdown graphs");
  console.log("  report           Generate the intelligence graph statistics and queue report");
  console.log("  status           Print node/edge metrics and input availability statuses");
  console.log("  inspect latest   Show a concise preview of the latest compiled graph");
  console.log("\nOptions:");
  console.log("  --dry-run        Simulate graph compilation and formatting without writing files");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-grounded-index-graph -- \"help\"");
  console.log("  npm run notebooklm-grounded-index-graph -- \"build\"");
  console.log("  npm run notebooklm-grounded-index-graph -- \"build\" --dry-run");
  console.log("  npm run notebooklm-grounded-index-graph -- \"status\"");
  console.log("  npm run notebooklm-grounded-index-graph -- \"inspect latest\"");
  console.log("=========================================");
}

printHelp();
