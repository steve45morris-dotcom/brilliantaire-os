function printHelp() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP READINESS GATE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-readiness-gate -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  scan                                      Scan environment for variables and client configs");
  console.log("  decision                                  Compile live integration decision report");
  console.log("  blockers                                  Compile current outstanding blockers report");
  console.log("  status                                    Print overall setup review and status summary");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-readiness-gate -- \"help\"");
  console.log("  npm run notebooklm-mcp-readiness-gate -- \"scan\"");
  console.log("  npm run notebooklm-mcp-readiness-gate -- \"decision\"");
  console.log("  npm run notebooklm-mcp-readiness-gate -- \"status\"");
  console.log("=========================================");
}

printHelp();
