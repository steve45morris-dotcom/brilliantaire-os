function printHelp() {
  console.log("=========================================");
  console.log("⚙️ NOTEBOOKLM MCP EXECUTE COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-execute -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help                                      Print this help guide");
  console.log("  prepare-query source-summary              Prepare source-summary payload from source pack");
  console.log("  prepare-query workflow-extraction         Prepare workflow-extraction payload");
  console.log("  prepare-query weak-claims-review          Prepare weak-claims-review payload");
  console.log("  dry-run source-summary                    Simulate execution on source-summary payload");
  console.log("  dry-run workflow-extraction               Simulate execution on workflow-extraction payload");
  console.log("  status                                    Print safety configs and latest reports status");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-execute -- \"help\"");
  console.log("  npm run notebooklm-mcp-execute -- \"prepare-query source-summary\"");
  console.log("  npm run notebooklm-mcp-execute -- \"dry-run source-summary\"");
  console.log("  npm run notebooklm-mcp-execute -- \"status\"");
  console.log("=========================================");
}

printHelp();
