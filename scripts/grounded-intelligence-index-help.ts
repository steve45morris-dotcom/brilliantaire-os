function printHelp() {
  console.log("=========================================");
  console.log("🕸️ GROUNDED INTELLIGENCE INDEX GRAPH HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run grounded-index -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  build            Compile response intelligence files into JSON & Markdown graphs");
  console.log("  report           Generate the intelligence graph statistics and queue report");
  console.log("  status           Print node/edge metrics and input availability statuses");
  console.log("  inspect latest   Show a concise preview of the latest compiled graph");
  console.log("\nExample runs:");
  console.log("  npm run grounded-index -- \"help\"");
  console.log("  npm run grounded-index -- \"build\"");
  console.log("  npm run grounded-index -- \"status\"");
  console.log("  npm run grounded-index -- \"inspect latest\"");
  console.log("=========================================");
}

printHelp();
