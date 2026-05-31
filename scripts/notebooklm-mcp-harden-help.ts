function printHelp() {
  console.log("=========================================");
  console.log("🔒 NOTEBOOKLM MCP HARDENING COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-harden -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  create-env-template                      Generate staged environment template with safety references");
  console.log("  create-mcp-template                      Generate staged MCP configuration JSON file");
  console.log("  secret-hygiene                            Scan safe local codebase for suspicious credential patterns");
  console.log("  readiness-recheck                        Verify safety checklist and score configuration readiness");
  console.log("  status                                    Print overall configuration hardening status summary");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-harden -- \"help\"");
  console.log("  npm run notebooklm-mcp-harden -- \"create-env-template\"");
  console.log("  npm run notebooklm-mcp-harden -- \"secret-hygiene\"");
  console.log("  npm run notebooklm-mcp-harden -- \"status\"");
  console.log("=========================================");
}

printHelp();
