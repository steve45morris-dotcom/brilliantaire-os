// scripts/offline-tts-dry-run-renderer-help.ts
// Prints usage and commands for the Offline TTS Dry-Run Renderer.

function printHelp() {
  console.log("=========================================");
  console.log("🛡️ OFFLINE TTS DRY-RUN RENDERER HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run offline-tts-dry-run-renderer -- <command> [options]");
  console.log("\nAvailable commands:");
  console.log("  help             Print this help guide");
  console.log("  simulate / run   Scan Phase 11R TTS Export queue and simulate rendering");
  console.log("  status           Print scan counts, routes, and timing configurations");
  console.log("\nOptions:");
  console.log("  --dry-run        Standard dry-run behavior (audio is never generated)");
  console.log("\nRules:");
  console.log("  * Audio generation is disabled");
  console.log("  * Voice models or Piper TTS engine are not invoked");
  console.log("  * External APIs are not called");
  console.log("\nExample runs:");
  console.log("  npm run command -- \"offline-tts-dry-run-renderer-help\"");
  console.log("  npm run command -- \"offline-tts-dry-run-renderer\"");
  console.log("=========================================");
}

printHelp();
export {};
