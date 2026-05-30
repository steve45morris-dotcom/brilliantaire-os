function printVerifyHelp() {
  console.log("=================================================================================");
  console.log("🛰️ PLATFORM VERIFICATION GATES: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("Purpose:");
  console.log("  Inspects platform output packages to verify readiness for manual copy-pasting.");
  console.log("  No platform API connections. Reads local packages and writes local reports.");
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run platform-verify-help                  Print this help manual.");
  console.log("  npm run platform-verify -- \"sporty youtube\"    Verify YouTube posting package.");
  console.log("  npm run platform-verify -- \"sporty tiktok\"     Verify TikTok posting package.");
  console.log("  npm run platform-verify -- \"sporty instagram\"  Verify Instagram posting package.");
  console.log("  npm run platform-verify -- \"sporty facebook\"   Verify Facebook posting package.");
  console.log("  npm run platform-verify -- \"sporty whatsapp\"   Verify WhatsApp posting package.");
  console.log("  npm run platform-verify -- \"sporty obsidian\"   Verify Obsidian campaign note.");
  console.log("  npm run platform-verify -- \"sporty all\"         Verify all platform packages & compile summary.");
  console.log("  npm run platform-verify -- \"status sporty\"      Display packages and reports status.");
  console.log("=================================================================================");
}

printVerifyHelp();
