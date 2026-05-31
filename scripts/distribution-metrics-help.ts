function printMetricsHelp() {
  console.log("=================================================================================");
  console.log("📊 DISTRIBUTION METRICS & ARCHIVING: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("Purpose:");
  console.log("  Generates manual metric entry templates, parses platform logs, and indexes local files.");
  console.log("  Strictly offline. Creator enters metrics manually; zero auto-scraping.");
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run distribution-metrics-help                   Print this help manual.");
  console.log("  npm run distribution-metrics -- \"sporty entry youtube\"   Generate YouTube metric entry.");
  console.log("  npm run distribution-metrics -- \"sporty entry tiktok\"    Generate TikTok metric entry.");
  console.log("  npm run distribution-metrics -- \"sporty entry instagram\" Generate Instagram metric entry.");
  console.log("  npm run distribution-metrics -- \"sporty entry facebook\"  Generate Facebook metric entry.");
  console.log("  npm run distribution-metrics -- \"sporty entry whatsapp\"  Generate WhatsApp metric entry.");
  console.log("  npm run distribution-metrics -- \"sporty entry obsidian\"  Generate Obsidian metric entry.");
  console.log("  npm run distribution-metrics -- \"sporty report\"          Generate distribution performance report.");
  console.log("  npm run distribution-metrics -- \"sporty archive-index\"   Generate local archive index.");
  console.log("  npm run distribution-metrics -- \"sporty status\"          Display manual metrics logging status.");
  console.log("=================================================================================");
}

printMetricsHelp();
