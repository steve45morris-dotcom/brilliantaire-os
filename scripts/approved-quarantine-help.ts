function printQuarantineHelp() {
  console.log("=========================================");
  console.log("🛡️ APPROVED QUARANTINE EXECUTOR - HELP & DIRECTIVES");
  console.log("=========================================");
  console.log("This module safely moves approved duplicate cleanup candidates into a quarantine directory with rollback metadata.");
  console.log("\nRules Enforced:");
  console.log("  1. Quarantine-Only: Permanent file deletion is disabled. No unlinks occur.");
  console.log("  2. Double-Gated Execution: Live moves require a prior dry-run AND the explicit --confirm flag.");
  console.log("  3. Non-Destructive Protection: System core directories, models, git, and configuration files are protected.");
  console.log("  4. Command Router Integrity: Alias-blocked exact-name routing applies.");
  console.log("\n📋 Available subcommands (pass as argument):");
  console.log("  - dry-run       : Simulate file movement based on approved list and output dry-run report");
  console.log("  - execute       : Execute approved file moves. REQUIRES the '--confirm' flag");
  console.log("  - manifest      : Compile active quarantine manifest of relocated files");
  console.log("  - rollback-plan : Generate manual rollback restore instructions for verification");
  console.log("  - status        : Print execution status metrics and latest report dashboard");
  console.log("  - help          : Print this documentation menu");
  console.log("\n💡 Usage:");
  console.log("  npm run approved-quarantine -- \"dry-run\"");
  console.log("  npm run approved-quarantine -- \"execute\" --confirm");
  console.log("  npm run approved-quarantine -- \"manifest\"");
  console.log("  npm run approved-quarantine -- \"rollback-plan\"");
  console.log("  npm run approved-quarantine -- \"status\"");
  console.log("=========================================");
}

printQuarantineHelp();
