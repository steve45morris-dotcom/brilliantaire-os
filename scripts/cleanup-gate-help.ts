import {
  CLEANUP_STAGING_ONLY,
  ALLOW_DIRECT_DELETE,
  ALLOW_RM_COMMANDS,
  REQUIRE_QUARANTINE_FIRST,
  REQUIRE_MANUAL_APPROVAL,
  ALLOW_PROJECT_AUTO_REGISTER
} from '../config/cleanup-gate.js';

function printHelp() {
  console.log("=================================================================");
  console.log("🛡️  PHASE 12A: DUPLICATE CLEANUP STAGING GATE");
  console.log("=================================================================");
  console.log("Governed maintenance controls under the Workflow Auditor.\n");

  console.log("Available Subcommands:");
  console.log("  scan-duplicates   Scan target folderbriefs for timestamped duplicates");
  console.log("  stage-quarantine  Read latest scan report and stage a quarantine plan");
  console.log("  restore-plan      Generate safety shell restore script for staged files");
  console.log("  project-drift     Scan Projects directories and list unregistered ones");
  console.log("  status            Show status dashboard of latest reports and plans");
  console.log("  help              Show this command helper menu\n");

  console.log("Safety Guardrail Parameters Configuration:");
  console.log(`  CLEANUP_STAGING_ONLY:        ${CLEANUP_STAGING_ONLY ? 'ENABLED (Dry-run mode only)' : 'DISABLED'}`);
  console.log(`  ALLOW_DIRECT_DELETE:         ${ALLOW_DIRECT_DELETE ? 'ALLOWED 🚨' : 'BLOCKED ✅'}`);
  console.log(`  ALLOW_RM_COMMANDS:           ${ALLOW_RM_COMMANDS ? 'ALLOWED 🚨' : 'BLOCKED ✅'}`);
  console.log(`  REQUIRE_QUARANTINE_FIRST:     ${REQUIRE_QUARANTINE_FIRST ? 'YES ✅' : 'NO'}`);
  console.log(`  REQUIRE_MANUAL_APPROVAL:     ${REQUIRE_MANUAL_APPROVAL ? 'REQUIRED ✅' : 'NONE'}`);
  console.log(`  ALLOW_PROJECT_AUTO_REGISTER: ${ALLOW_PROJECT_AUTO_REGISTER ? 'YES 🚨' : 'BLOCKED ✅'}`);
  console.log("=================================================================");
}

printHelp();
