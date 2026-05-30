function printReleaseHelp() {
  console.log("=================================================================================");
  console.log("🛰️ MANUAL RELEASE CHECKLISTS: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("Purpose:");
  console.log("  Compiles verified platform packages into a manual posting checklist & runbook.");
  console.log("  Strictly offline. Creator copy-pastes content manually to live profiles.");
  console.log("");
  console.log("Available Commands:");
  console.log("  npm run manual-release-help                  Print this help manual.");
  console.log("  npm run manual-release -- \"sporty checklist\"  Generate manual release checklists.");
  console.log("  npm run manual-release -- \"sporty runbook\"   Generate step-by-step release runbook.");
  console.log("  npm run manual-release -- \"sporty status\"    Display manual release readiness status.");
  console.log("  npm run manual-release -- \"sporty all\"       Generate checklist & runbook, print status.");
  console.log("=================================================================================");
}

printReleaseHelp();
