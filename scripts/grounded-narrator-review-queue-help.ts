// scripts/grounded-narrator-review-queue-help.ts
// Prints usage and available subcommands for grounded narrator review queue compiler.

function printHelp() {
  console.log("=========================================");
  console.log("🎙️ GROUNDED NARRATOR REVIEW QUEUE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run grounded-narrator-review-queue -- <command> [options]");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  build            Compile Obsidian dashboards into narration briefs and status lists");
  console.log("  status           Print narration blocks statistics and verification counts");
  console.log("\nOptions:");
  console.log("  --dry-run        Simulate narration blocks generation without file writes");
  console.log("\nExample runs:");
  console.log("  npm run grounded-narrator-review-queue -- \"help\"");
  console.log("  npm run grounded-narrator-review-queue -- \"build\"");
  console.log("  npm run grounded-narrator-review-queue -- \"build\" --dry-run");
  console.log("=========================================");
}

printHelp();
export {};
