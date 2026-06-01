import { COMMAND_REGISTRY } from '../config/commands.js';

function printCleanupHelp() {
  console.log("=========================================");
  console.log("🧹 DUPLICATE CLEANUP & QUARANTINE - HELP & DIRECTIVES");
  console.log("=========================================");
  console.log("This module scans outputs, detect duplicate timestamp variants, identifies stale reports, and stages cleanup recommendations.");
  console.log("\nRules Enforced:");
  console.log("  1. Strict Scan-Only: No file deletions or source code modifications allowed.");
  console.log("  2. Isolation: Models, secrets, and git internals are explicitly excluded from scanning.");
  console.log("  3. Non-Destructive: Quarantine lists only index candidate files for manual verification; no files are moved.");
  console.log("  4. Command Router exact name matches required for primary command. Aliases are blocked.");
  console.log("\n📋 Available subcommands (pass as argument):");
  console.log("  - scan             : Scan allowed roots and generate duplicate variant reports");
  console.log("  - stale            : Detect outdated reports, empty files, and orphan packets");
  console.log("  - quarantine-index : Generate read-only index of duplicate/stale candidates");
  console.log("  - review-list      : Sort candidates into confidence levels for manual review");
  console.log("  - status           : Print brief status of the latest reports and key metrics");
  console.log("  - help             : Display this help message");
  console.log("\n💡 Usage:");
  console.log("  npm run duplicate-cleanup -- \"scan\"");
  console.log("  npm run duplicate-cleanup -- \"stale\"");
  console.log("  npm run duplicate-cleanup -- \"quarantine-index\"");
  console.log("  npm run duplicate-cleanup -- \"review-list\"");
  console.log("  npm run duplicate-cleanup -- \"status\"");
  console.log("\n=========================================");
}

printCleanupHelp();
