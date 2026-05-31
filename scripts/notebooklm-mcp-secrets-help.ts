function printHelp() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP SECRETS STAGING HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-secrets -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  create-templates                          Create local placeholder config examples");
  console.log("  redaction-check                           Scan project files for suspicious credential keys");
  console.log("  readiness                                 Compile secrets staging readiness report");
  console.log("  status                                    Print overall secrets review status summary");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-secrets -- \"help\"");
  console.log("  npm run notebooklm-mcp-secrets -- \"create-templates\"");
  console.log("  npm run notebooklm-mcp-secrets -- \"redaction-check\"");
  console.log("  npm run notebooklm-mcp-secrets -- \"status\"");
  console.log("=========================================");
}

printHelp();
