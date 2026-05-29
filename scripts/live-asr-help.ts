function printLiveASRHelp() {
  console.log("=================================================================================");
  console.log("🎙️  LIVE MICROPHONE ASR BRIDGE: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Serves as the intake adapter for live microphone speech-to-text outputs.");
  console.log("  It processes transcribed text and safely routes it to the manual staging area.");
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. No Direct Execution: Transcripts cannot execute scripts or commands directly.");
  console.log("  2. Double-Decoupled Flow: Must transit through vibevoice-transcript, then");
  console.log("     voice-queue, and voice-confirm layers.");
  console.log("  3. Non-Always-On: No automatic background listener runs by default.");
  console.log("");
  console.log("Allowed Files:");
  console.log("  - Transcripts: Plain text (.txt) files only.");
  console.log("  - Audio (Future): .wav, .mp3, .m4a (Max 25MB).");
  console.log("");
  console.log("Command Flow:");
  console.log("  [voice_input/live/] -> (live-asr-import) -> [voice_input/manual/]");
  console.log("                      -> (vibevoice-transcript) -> [voice_queue/inbox/]");
  console.log("                      -> (voice-queue) -> [pending_confirmation/]");
  console.log("                      -> (voice-confirm) -> [executed command]");
  console.log("");
  console.log("Test Sequence:");
  console.log("  1. npm run live-asr-test       Create dummy voice_input/live/ files.");
  console.log("  2. npm run live-asr-import     Normalize, validate and move to manual/.");
  console.log("  3. npm run vibevoice-transcript Stage into voice_queue/inbox/.");
  console.log("  4. npm run voice-queue         Parse, check risk level, execute/route.");
  console.log("  5. npm run voice-pending       View pending confirmation queue.");
  console.log("");
  console.log("⚠️  WARNING: This bridge DOES NOT execute commands directly. Ingested phrases");
  console.log("   undergo strict validation and explicit human approval.");
  console.log("=================================================================================");
}

printLiveASRHelp();
