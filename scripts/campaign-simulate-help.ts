function printCampaignSimulateHelp() {
  console.log("=================================================================================");
  console.log("📊 CAMPAIGN SIMULATION & VALIDATION ENGINE: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Performs offline simulation runs and validation score auditing against");
  console.log("  generated schedules, posting queues, and execution logs before execution.");
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. Local Only: No social media API requests are made.");
  console.log("  2. No Auto-Posting: Completely sandboxed within read-only file scans.");
  console.log("  3. Non-Destructive: Never automatically updates or deletes original assets.");
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run campaign-simulate -- \"help\"             Display this help menu.");
  console.log("  npm run campaign-simulate -- \"sporty\"           Run simulation score analysis.");
  console.log("  npm run campaign-simulate -- \"validate sporty\"   Perform core checklist validation checks.");
  console.log("  npm run campaign-simulate -- \"status sporty\"     Check latest simulation status logs.");
  console.log("=================================================================================");
}

printCampaignSimulateHelp();
