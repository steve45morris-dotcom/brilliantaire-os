// scripts/notebooklm-obsidian-dashboard-sync-help.ts
// Prints usage and available subcommands for Obsidian dashboard sync processor.

function printHelp() {
  console.log("=========================================");
  console.log("🎛️ OBSIDIAN DASHBOARD SYNC HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-obsidian-dashboard-sync -- <command> [options]");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  sync / build     Process graph JSON and populate Obsidian-ready markdown dashboards");
  console.log("  status           Display index graph source parameters and target directories");
  console.log("\nOptions:");
  console.log("  --dry-run        Simulate templating and validation without writing files");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-obsidian-dashboard-sync -- \"help\"");
  console.log("  npm run notebooklm-obsidian-dashboard-sync -- \"sync\"");
  console.log("  npm run notebooklm-obsidian-dashboard-sync -- \"sync\" --dry-run");
  console.log("=========================================");
}

printHelp();
export {};
