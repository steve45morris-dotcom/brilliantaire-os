import { COMMAND_REGISTRY } from '../config/commands.js';

function printApprovalHelp() {
  console.log("=========================================");
  console.log("🛡️ CLEANUP APPROVAL GATE - HELP & DIRECTIVES");
  console.log("=========================================");
  console.log("This module classifies duplicate candidates, builds approval check matrices, protects critical directories, and tracks readiness.");
  console.log("\nRules Enforced:");
  console.log("  1. Strict Staging: No file deletions or file movements are performed.");
  console.log("  2. Do-Not-Touch Protection: Enforces strict rules to safeguard git, dependencies, models, credentials, and OS core files.");
  console.log("  3. Non-Destructive: Generates read-only checklists for human verification and manual sign-off.");
  console.log("  4. Safe Command Router: Requires exact command name matches; aliases are forbidden.");
  console.log("\n📋 Available subcommands (pass as argument):");
  console.log("  - classify      : Scan latest reports and write candidate classifications");
  console.log("  - approval-list : Build manual approval check matrix checklist");
  console.log("  - do-not-touch  : Build protected system file registry checklist");
  console.log("  - summary       : Aggregate metrics, count candidates, and declare readiness");
  console.log("  - status        : Print console dashboard of files, directories, and latest checklists");
  console.log("  - help          : Print this help directives menu");
  console.log("\n💡 Usage:");
  console.log("  npm run cleanup-approval -- \"classify\"");
  console.log("  npm run cleanup-approval -- \"approval-list\"");
  console.log("  npm run cleanup-approval -- \"do-not-touch\"");
  console.log("  npm run cleanup-approval -- \"summary\"");
  console.log("  npm run cleanup-approval -- \"status\"");
  console.log("\n=========================================");
}

printApprovalHelp();
