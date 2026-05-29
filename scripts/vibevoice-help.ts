function printVibeVoiceHelp() {
  console.log("=================================================================================");
  console.log("🎙️  VIBEVOICE TRANSCRIPT PRODUCER: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Serves as the secure staging bridge, transcribing manual files into");
  console.log("  the voice command queue inbox for validation. Microphone control is disabled.");
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. No Direct Shell Execution: Speech transcripts cannot run raw commands.");
  console.log("  2. Ingestion Sandboxing: Transcripts write strictly to voice_queue/inbox/.");
  console.log("  3. Decoupled Processing: Release gates require confirmation reviews.");
  console.log("");
  console.log("Accepted Input Format:");
  console.log("  - Static plain text transcripts (.txt files).");
  console.log("  - Must be stored under voice_input/manual/ directory.");
  console.log("  - Maximum phrase length: 500 characters.");
  console.log("");
  console.log("CLI Commands:");
  console.log("  npm run vibevoice-help         Display this help menu.");
  console.log("  npm run vibevoice-test         Prepare sample transcript test cases.");
  console.log("  npm run vibevoice-transcript   Scan manual inputs and stage to queue.");
  console.log("");
  console.log("VibeVoice Ingestion Queue Flow:");
  console.log("  [manual/ transcript.txt] -> (vibevoice-transcript) -> [voice_queue/inbox/]");
  console.log("                           -> (voice-queue) -> [pending_confirmation/]");
  console.log("                           -> (voice-confirm) -> [command executed]");
  console.log("=================================================================================");
}

printVibeVoiceHelp();
