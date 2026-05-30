import {
  ENABLE_BACKGROUND_AUTOMATION,
  DRY_RUN_DEFAULT,
  BACKGROUND_SCHEDULES
} from '../config/background-automation.js';

function printBackgroundHelp() {
  console.log("=================================================================================");
  console.log("🛰️ CONTROLLED BACKGROUND AUTOMATION: Brilliantaire OS");
  console.log("=================================================================================");
  console.log("");
  console.log("Purpose:");
  console.log("  Allows safe scheduling of approved local routines via cron or launchd adapters.");
  console.log("  Default state is locked (disabled) to ensure user sovereignty.");
  console.log("");
  console.log("Global Status Matrix:");
  console.log(`  - Global Status:    ${ENABLE_BACKGROUND_AUTOMATION ? '🟢 ENABLED' : '🔴 DISABLED (Locked)'}`);
  console.log(`  - Dry-Run Default:  ${DRY_RUN_DEFAULT ? '🟢 YES' : '🔴 NO'}`);
  console.log("");
  console.log("Safety Rules:");
  console.log("  1. Isolation Guard: All tasks must execute through the Safe Command Router.");
  console.log("  2. Sovereign Consent: Requires --confirm parameter and ENABLE_BACKGROUND_AUTOMATION=true.");
  console.log("  3. No External Actions: Social posting and destructive actions are hard-blocked.");
  console.log("");
  console.log("Available Schedules:");
  console.log("");

  BACKGROUND_SCHEDULES.forEach(s => {
    console.log(`  🔹 Schedule:  "${s.name}"`);
    console.log(`     Routine:   ${s.routine}`);
    console.log(`     Owning Agent: ${s.owningAgent}`);
    console.log(`     Risk Level:   ${s.riskLevel.toUpperCase()}`);
    console.log(`     Time Trigger: ${s.suggestedTime}`);
    console.log(`     Status:       ${s.enabled ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
    console.log(`     Description:  ${s.description}`);
    console.log("");
  });

  console.log("Available CLI Commands:");
  console.log("  npm run background-help                         Print this manual.");
  console.log("  npm run background-status                       Display system config and run logs.");
  console.log("  npm run background-dry-run -- <schedule-name>    Dry run test schedule execution.");
  console.log("  npm run background-run -- <schedule-name>        Execute scheduled routine (requires exact command).");
  console.log("=================================================================================");
}

printBackgroundHelp();
