function printHelp() {
  console.log("=========================================");
  console.log("🛰️ NOTEBOOKLM MCP CORRECTION PACK HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-correction-pack -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  blockers                                  Generate blockers correction report");
  console.log("  env-map                                   Generate environment variables key map");
  console.log("  local-config                              Generate local configuration checklist");
  console.log("  git-push-recovery                         Generate git push recovery runbook");
  console.log("  readiness-rerun                           Generate readiness rerun runbook");
  console.log("  all                                       Generate all correction pack documents");
  console.log("  status                                    Print correction pack files status review");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-correction-pack -- \"help\"");
  console.log("  npm run notebooklm-mcp-correction-pack -- \"blockers\"");
  console.log("  npm run notebooklm-mcp-correction-pack -- \"env-map\"");
  console.log("  npm run notebooklm-mcp-correction-pack -- \"all\"");
  console.log("  npm run notebooklm-mcp-correction-pack -- \"status\"");
  console.log("=========================================");
}

printHelp();
