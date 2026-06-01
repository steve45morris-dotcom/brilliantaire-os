import {
  QUARANTINE_ONLY,
  ALLOW_PERMANENT_DELETE,
  ALLOW_RM_COMMANDS,
  REQUIRE_CONFIRM_FLAG,
  REQUIRE_STAGED_PLAN,
  REQUIRE_CHECKSUM_VALIDATION,
  REQUIRE_RESTORE_MAP
} from '../config/quarantine-execution.js';

function printHelp() {
  console.log("=================================================================");
  console.log("🛡️  PHASE 12B: APPROVED QUARANTINE EXECUTION GATE");
  console.log("=================================================================");
  console.log("Governed quarantine execution controls under the Workflow Auditor.\n");

  console.log("Available Subcommands:");
  console.log("  dry-run           Preview files to quarantine from the staging report");
  console.log("  execute-approved  Move staged duplicates into quarantine (requires --confirm)");
  console.log("  checksum          Verify integrity checksums of quarantined files");
  console.log("  restore-map       Generate rollback bash restore script for quarantined files");
  console.log("  status            Show status dashboard of latest execution reports");
  console.log("  help              Show this command helper menu\n");

  console.log("Safety Guardrail Parameters Configuration:");
  console.log(`  QUARANTINE_ONLY:             ${QUARANTINE_ONLY ? 'ENABLED ✅' : 'DISABLED'}`);
  console.log(`  ALLOW_PERMANENT_DELETE:      ${ALLOW_PERMANENT_DELETE ? 'ALLOWED 🚨' : 'BLOCKED ✅'}`);
  console.log(`  ALLOW_RM_COMMANDS:           ${ALLOW_RM_COMMANDS ? 'ALLOWED 🚨' : 'BLOCKED ✅'}`);
  console.log(`  REQUIRE_CONFIRM_FLAG:        ${REQUIRE_CONFIRM_FLAG ? 'REQUIRED ✅' : 'NONE'}`);
  console.log(`  REQUIRE_STAGED_PLAN:         ${REQUIRE_STAGED_PLAN ? 'REQUIRED ✅' : 'NONE'}`);
  console.log(`  REQUIRE_CHECKSUM_VALIDATION: ${REQUIRE_CHECKSUM_VALIDATION ? 'REQUIRED ✅' : 'NONE'}`);
  console.log(`  REQUIRE_RESTORE_MAP:         ${REQUIRE_RESTORE_MAP ? 'REQUIRED ✅' : 'NONE'}`);
  console.log("=================================================================");
}

printHelp();
