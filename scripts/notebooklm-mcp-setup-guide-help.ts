function printHelp() {
  console.log("=========================================");
  console.log("📖 NOTEBOOKLM MCP MANUAL SETUP GUIDE COMMANDS");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-setup-guide -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  runbook                                   Compile the manual setup runbook details");
  console.log("  env-instructions                          Generate .env.local setup guidelines document");
  console.log("  config-copy                               Generate MCP sidecar config copy guide");
  console.log("  readiness-rerun                           Generate readiness recheck and rerun validation instructions");
  console.log("  rollback                                  Generate safety rollback and deactivation plan");
  console.log("  all                                       Generate all setup guides and checklists at once");
  console.log("  status                                    Print manual setup status verification");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-setup-guide -- \"help\"");
  console.log("  npm run notebooklm-mcp-setup-guide -- \"runbook\"");
  console.log("  npm run notebooklm-mcp-setup-guide -- \"all\"");
  console.log("  npm run notebooklm-mcp-setup-guide -- \"status\"");
  console.log("=========================================");
}

printHelp();
