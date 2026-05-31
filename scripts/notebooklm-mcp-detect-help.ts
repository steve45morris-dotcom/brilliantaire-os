function printHelp() {
  console.log("=========================================");
  console.log("🔍 NOTEBOOKLM MCP DETECT COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-detect -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  scan                                      Inspect local configs for NotebookLM MCP setup");
  console.log("  status                                    Print the status of current detection files and flags");
  console.log("  capability-report                         Compile and format a detailed capability and risk report");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-detect -- \"help\"");
  console.log("  npm run notebooklm-mcp-detect -- \"scan\"");
  console.log("  npm run notebooklm-mcp-detect -- \"status\"");
  console.log("  npm run notebooklm-mcp-detect -- \"capability-report\"");
  console.log("=========================================");
}

printHelp();
