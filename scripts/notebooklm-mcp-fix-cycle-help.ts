// scripts/notebooklm-mcp-fix-cycle-help.ts
// Prints help guidelines and usage instructions for the MCP Setup Fix Cycle.

function printHelp() {
  console.log("=========================================");
  console.log("🔄 NOTEBOOKLM MCP SETUP FIX CYCLE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-fix-cycle -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help               Print this help guide");
  console.log("  tasks              Create environment/config checklists and generate fix tasks");
  console.log("  compare            Compare latest readiness and review scores to measure progress");
  console.log("  next-pass          Generate sequential manual runbooks for next setup pass");
  console.log("  status             Read checklists/reports metadata and print fix cycle status");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"help\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"tasks\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"compare\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"next-pass\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"status\"");
  console.log("=========================================");
}

printHelp();
