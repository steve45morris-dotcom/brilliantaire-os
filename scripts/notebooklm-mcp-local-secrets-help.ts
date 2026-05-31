// scripts/notebooklm-mcp-local-secrets-help.ts
// Prints available commands and guidelines for the NotebookLM MCP Local Secrets Staging Guide.

function printHelp() {
  console.log("=========================================");
  console.log("🔐 NOTEBOOKLM MCP LOCAL SECRETS HELP");
  console.log("=========================================");
  console.log("\nUsage: npm run notebooklm-mcp-local-secrets -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help               Print this help guide");
  console.log("  env-guide          Generate environment setup guide for .env.local");
  console.log("  checklist          Compile the local secret verification checklist");
  console.log("  gitignore-check    Verify gitignore entries to prevent credential leaks");
  console.log("  readiness-rerun    Generate readiness recheck runbook script");
  console.log("  all                Compile env-guide, checklist, gitignore-check, and readiness-rerun");
  console.log("  status             Check staging files status and print recommendations");
  console.log("\nExample runs:");
  console.log("  npm run notebooklm-mcp-local-secrets -- \"help\"");
  console.log("  npm run notebooklm-mcp-local-secrets -- \"env-guide\"");
  console.log("  npm run notebooklm-mcp-local-secrets -- \"all\"");
  console.log("  npm run notebooklm-mcp-local-secrets -- \"status\"");
  console.log("=========================================");
}

printHelp();
