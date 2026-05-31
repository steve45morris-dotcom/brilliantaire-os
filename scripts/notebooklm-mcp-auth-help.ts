function printHelp() {
  console.log("=========================================");
  console.log("🔐 NOTEBOOKLM MCP AUTHENTICATION COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-auth -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  scan                                      Scan local configurations for env profiles readiness");
  console.log("  scope-review                              Compile permission scopes and restrictions report");
  console.log("  activation-checklist                      Generate activation checklist verifying safety parameters");
  console.log("  status                                    Print overall authorization score, blockers, and variables state");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-auth -- \"help\"");
  console.log("  npm run notebooklm-mcp-auth -- \"scan\"");
  console.log("  npm run notebooklm-mcp-auth -- \"scope-review\"");
  console.log("  npm run notebooklm-mcp-auth -- \"status\"");
  console.log("=========================================");
}

printHelp();
