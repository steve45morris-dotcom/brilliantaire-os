// scripts/notebooklm-mcp-verify-loop-help.ts
// Prints help guidelines and usage instructions for the Local MCP Setup Verification Loop.

function printHelp() {
  console.log("=========================================");
  console.log("🔄 NOTEBOOKLM MCP VERIFICATION LOOP HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-verify-loop -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help               Print this help guide");
  console.log("  chain              Run setup readiness checks via npm scripts and write verification chain report");
  console.log("  final-check        Assess setup gate readiness and determine eligibility for Phase 11M");
  console.log("  status             Show details on the latest generated reports, readiness score, and eligibility");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-verify-loop -- \"help\"");
  console.log("  npm run notebooklm-mcp-verify-loop -- \"chain\"");
  console.log("  npm run notebooklm-mcp-verify-loop -- \"final-check\"");
  console.log("  npm run notebooklm-mcp-verify-loop -- \"status\"");
  console.log("=========================================");
}

printHelp();
