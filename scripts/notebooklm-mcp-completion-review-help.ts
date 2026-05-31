function printHelp() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP COMPLETION REVIEW HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-completion-review -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  env-check                                 Check presence of required environment variable names");
  console.log("  review                                    Compile manual setup completion review report");
  console.log("  eligibility                               Compile live adapter integration eligibility report");
  console.log("  signoff                                   Generate manual sign-off checklist");
  console.log("  status                                    Print overall review and setup status summary");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-completion-review -- \"help\"");
  console.log("  npm run notebooklm-mcp-completion-review -- \"env-check\"");
  console.log("  npm run notebooklm-mcp-completion-review -- \"review\"");
  console.log("  npm run notebooklm-mcp-completion-review -- \"status\"");
  console.log("=========================================");
}

printHelp();
