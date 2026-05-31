function printHelp() {
  console.log("=========================================");
  console.log("🎙️ GROUNDED NARRATOR REVIEW QUEUE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run grounded-narrator-review -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  queue            Read graph and prepare narration candidates card queue");
  console.log("  brief            Compile narrator-ready brief from safest candidates only");
  console.log("  reject-weak      Read weak claims and generate rejection details checklist");
  console.log("  report           Generate queue audit metrics and safety report");
  console.log("  status           Print current file states and metrics summary");
  console.log("\nExample runs:");
  console.log("  npm run grounded-narrator-review -- \"help\"");
  console.log("  npm run grounded-narrator-review -- \"queue\"");
  console.log("  npm run grounded-narrator-review -- \"brief\"");
  console.log("  npm run grounded-narrator-review -- \"reject-weak\"");
  console.log("  npm run grounded-narrator-review -- \"report\"");
  console.log("  npm run grounded-narrator-review -- \"status\"");
  console.log("=========================================");
}

printHelp();
