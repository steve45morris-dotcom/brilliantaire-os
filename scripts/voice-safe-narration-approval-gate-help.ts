// scripts/voice-safe-narration-approval-gate-help.ts
// Prints usage and available subcommands for voice-safe narration approval gate compiler.

function printHelp() {
  console.log("=========================================");
  console.log("🛡️ VOICE-SAFE NARRATION APPROVAL GATE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run voice-safe-narration-approval-gate -- <command> [options]");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  check / build    Scan queue JSON and compile approved & rejected manifests");
  console.log("  status           Print scan counts and local file readiness markers");
  console.log("\nOptions:");
  console.log("  --test-approve   In-memory approval override for a blockId (for verification testing)");
  console.log("  --dry-run        Simulate gate processing without staging new files");
  console.log("\nExample runs:");
  console.log("  npm run voice-safe-narration-approval-gate -- \"help\"");
  console.log("  npm run voice-safe-narration-approval-gate -- \"check\"");
  console.log("  npm run voice-safe-narration-approval-gate -- \"check\" --test-approve narrator_block_3");
  console.log("  npm run voice-safe-narration-approval-gate -- \"check\" --dry-run");
  console.log("=========================================");
}

printHelp();
export {};
