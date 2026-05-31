function printHelp() {
  console.log("=========================================");
  console.log("🌾 KNOWLEDGE HARVEST ENGINE V1 COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run knowledge-harvest -- <command> [arguments]");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  intake-url <YOUTUBE_URL>                  Create a pending source record from a YouTube URL");
  console.log("  intake-transcript <TRANSCRIPT_FILE>       Ingest a local transcript file and generate structured note");
  console.log("  summarize                                 Summarize existing pending items (V1 limits)");
  console.log("  source-pack                               Generate aggregated NotebookLM source pack markdown");
  console.log("  workflow-ideas                            Generate Brilliantaire OS workflow ideas list");
  console.log("  status                                    Show counts of notes, source packs, workflow ideas, and actions");
  console.log("\nExample runs:");
  console.log("  npm run knowledge-harvest -- \"help\"");
  console.log("  npm run knowledge-harvest -- \"intake-url https://www.youtube.com/watch?v=12345\"");
  console.log("  npm run knowledge-harvest -- \"intake-transcript test_inputs/julian_goldie_sample_transcript.txt\"");
  console.log("  npm run knowledge-harvest -- \"source-pack\"");
  console.log("  npm run knowledge-harvest -- \"status\"");
  console.log("=========================================");
}

printHelp();
