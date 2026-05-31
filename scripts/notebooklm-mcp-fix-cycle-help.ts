// scripts/notebooklm-mcp-fix-cycle-help.ts
// Prints help guidelines and usage instructions for the MCP Setup Fix Cycle.

function printHelp() {
  console.log("=========================================");
  console.log("🔄 NOTEBOOKLM MCP SETUP FIX CYCLE HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-fix-cycle -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help               Print this help guide");
  console.log("  missing-env        Create environment checklist with required env vars");
  console.log("  local-config       Create local config rules check (e.g. .env.local/gitignore)");
  console.log("  rerun-sequence     Compile the exact testing command runbook sequentially");
  console.log("  decision-summary   Inspect latest gate state and output new eligibility status");
  console.log("  all                Generate missing-env, local-config, rerun-sequence, and decision-summary");
  console.log("  status             Read checklist metadata and print current setup status");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"help\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"missing-env\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"all\"");
  console.log("  npm run notebooklm-mcp-fix-cycle -- \"status\"");
  console.log("=========================================");
}

printHelp();
