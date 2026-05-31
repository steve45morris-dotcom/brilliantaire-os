function printHelp() {
  console.log("=========================================");
  console.log("📓 NOTEBOOKLM SIDE_BRIDGE COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-bridge -- <command> [arguments]");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  create-query <TOPIC>                      Generate a staged research query packet");
  console.log("  add-answer <ANSWER_FILE>                  Import a manually copied NotebookLM answer file");
  console.log("  export-obsidian                           Convert manual answers to staged Obsidian notes");
  console.log("  workflow-ideas                            Extract and format Brilliantaire OS workflow ideas");
  console.log("  source-pack                               Compile aggregated source pack guide");
  console.log("  status                                    Show counts of queries, answers, and pending actions");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-bridge -- \"help\"");
  console.log("  npm run notebooklm-bridge -- \"create-query ai-automation\"");
  console.log("  npm run notebooklm-bridge -- \"add-answer test_inputs/notebooklm_sample_answer.md\"");
  console.log("  npm run notebooklm-bridge -- \"export-obsidian\"");
  console.log("  npm run notebooklm-bridge -- \"status\"");
  console.log("=========================================");
}

printHelp();
