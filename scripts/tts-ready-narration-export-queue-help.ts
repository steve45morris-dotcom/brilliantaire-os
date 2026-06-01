// scripts/tts-ready-narration-export-queue-help.ts
// Prints usage and available subcommands for TTS-ready narration export queue compiler.

function printHelp() {
  console.log("=========================================");
  console.log("🛡️ TTS-READY NARRATION EXPORT QUEUE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run tts-ready-narration-export-queue -- <command> [options]");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  check / build    Scan approval manifest JSON and compile TTS-ready export queue");
  console.log("  status           Print scan counts and export readiness markers");
  console.log("\nOptions:");
  console.log("  --dry-run        Simulate export processing without staging new files");
  console.log("\nExample runs:");
  console.log("  npm run tts-ready-narration-export-queue -- \"help\"");
  console.log("  npm run tts-ready-narration-export-queue -- \"check\"");
  console.log("  npm run tts-ready-narration-export-queue -- \"check\" --dry-run");
  console.log("=========================================");
}

printHelp();
export {};
