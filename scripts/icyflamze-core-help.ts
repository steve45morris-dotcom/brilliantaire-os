function printHelp() {
  console.log("=========================================");
  console.log("🔥 ICYFLAMZE CORE COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run icyflamze-core -- <command>");
  console.log("\nAvailable commands:");
  console.log("  help              Print this list of available commands");
  console.log("  registry          Generate local project registry file");
  console.log("  obsidian-stage    Generate Obsidian staged note in write_staging");
  console.log("  season-summary    Generate Season 1 summary report");
  console.log("  sync-report       Generate integration sync status report");
  console.log("  status            Print latest files and configuration states");
  console.log("\nExample runs:");
  console.log("  npm run icyflamze-core -- \"help\"");
  console.log("  npm run icyflamze-core -- \"registry\"");
  console.log("  npm run icyflamze-core -- \"obsidian-stage\"");
  console.log("  npm run icyflamze-core -- \"season-summary\"");
  console.log("  npm run icyflamze-core -- \"sync-report\"");
  console.log("  npm run icyflamze-core -- \"status\"");
  console.log("=========================================");
}

printHelp();
