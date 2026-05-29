function printCampaignSchedulerHelp() {
  console.log("=================================================================================");
  console.log("📅 CAMPAIGN SCHEDULER DRAFT ENGINE: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Generates local markdown schedules, posting queues, and execution logs");
  console.log("  for marketing rollouts. Does not connect to APIs or auto-post.");
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. No External API calls: Runs fully locally.");
  console.log("  2. No Auto-Posting: Never communicates with external networks.");
  console.log("  3. No Shell Execution: No arbitrary shell execution vectors.");
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run campaign-scheduler -- \"help\"           Display this help menu.");
  console.log("  npm run campaign-scheduler -- \"create sporty\"   Generate a 21-day campaign schedule.");
  console.log("  npm run campaign-scheduler -- \"queue sporty\"    Generate a daily posting queue.");
  console.log("  npm run campaign-scheduler -- \"log sporty\"      Generate an execution log template.");
  console.log("  npm run campaign-scheduler -- \"status sporty\"   Print latest campaign status overview.");
  console.log("=================================================================================");
}

printCampaignSchedulerHelp();
