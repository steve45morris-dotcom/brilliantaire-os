function printHelp() {
  console.log("=========================================");
  console.log("📣 CAMPAIGN ENGINE COMMANDS: Brilliantaire OS");
  console.log("=========================================");
  console.log("\nUsage: npm run campaign -- <command> [target]");
  console.log("\nAvailable commands:");
  console.log("  list                      Print registry of all active campaigns");
  console.log("  brief <campaign>          Generate a campaign brief markdown document");
  console.log("  calendar <campaign>       Generate a 3-week multi-platform content calendar");
  console.log("  prompt-pack <campaign>    Generate pre-configured generative prompts");
  console.log("  checklist <campaign>      Generate a campaign execution readiness checklist");
  console.log("  create                    Generate a blank campaign scaffolding file");
  console.log("\nExample runs:");
  console.log("  npm run campaign -- \"list\"");
  console.log("  npm run campaign -- \"brief sporty\"");
  console.log("  npm run campaign -- \"calendar sporty\"");
  console.log("=========================================");
}

printHelp();
