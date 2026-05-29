import { AUTOMATION_ROUTINES } from '../config/automation.js';

function printAutomationHelp() {
  console.log("=================================================================================");
  console.log("🤖 LOCAL AUTOMATION RUNNER: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Executes pre-approved local maintenance routines in a structured sequence.");
  console.log("  All commands are strictly executed through the Safe Command Router.");
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. No External Connections: Runs fully offline.");
  console.log("  2. Command Router Gateway: Never bypasses validation boundaries.");
  console.log("  3. Non-Destructive: Modifies zero historical logs or raw vaults.");
  console.log("");
  console.log("Available Routines:");
  console.log("");

  AUTOMATION_ROUTINES.forEach(r => {
    console.log(`  🔹 Routine: "${r.name}"`);
    console.log(`     Description:  ${r.description}`);
    console.log(`     Owning Agent: ${r.owningAgent}`);
    console.log(`     Risk Level:   ${r.riskLevel.toUpperCase()}`);
    console.log(`     Status:       ${r.enabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);
    console.log(`     Commands:     ${r.commands.map(c => `\`${c}\``).join(', ')}`);
    console.log("");
  });

  console.log("Execution Syntax:");
  console.log("  npm run automation-runner -- <routine-name>");
  console.log("");
  console.log("Examples:");
  console.log("  npm run automation-runner -- \"daily-check\"");
  console.log("  npm run automation-runner -- \"campaign-check\"");
  console.log("=================================================================================");
}

printAutomationHelp();
