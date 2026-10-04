import { COMMAND_REGISTRY } from '../config/commands.js';

function printDocumentationDriftDetectorHelp() {
  console.log("=========================================");
  console.log("DOCUMENTATION DRIFT DETECTOR - HELP");
  console.log("=========================================");
  console.log("This module scans all 8 system indexes for cross-reference");
  console.log("consistency, detects stale pointers, missing command docs,");
  console.log("orphaned npm scripts, and narrator source mismatches —");
  console.log("all WITHOUT modifying system state or contacting external");
  console.log("services.");
  console.log("\nCore Safety Rules Enforced:");
  console.log("  1. No Auto Fix: ALLOW_AUTO_FIX = false");
  console.log("  2. No External API Calls: ALLOW_EXTERNAL_API_CALLS = false");
  console.log("  3. No Direct Obsidian Write: ALLOW_DIRECT_OBSIDIAN_WRITE = false");
  console.log("  4. Human Approval Required: REQUIRE_HUMAN_APPROVAL = true");
  console.log("  5. Manual Review Required: REQUIRE_MANUAL_REVIEW = true");
  console.log("\n-----------------------------------------");
  console.log("  COMMANDS:");
  console.log("-----------------------------------------");
  console.log("\n  status");
  console.log("    Print configuration, safety flags, system indexes,");
  console.log("    cross-reference targets, and output directory status.");
  console.log("\n  scan-indexes");
  console.log("    Scan all 8 system indexes for presence and");
  console.log("    cross-reference consistency.");
  console.log("\n  audit-commands");
  console.log("    Cross-check config/commands.ts entries against");
  console.log("    COMMANDS.md rows and package.json npm scripts.");
  console.log("\n  audit-pointers");
  console.log("    Check SYSTEM_STATUS.md 'Next Upgrade' pointer");
  console.log("    against NEXT_ACTIONS.md completion status.");
  console.log("\n  audit-narration");
  console.log("    Cross-check config/narrator-sources.ts against");
  console.log("    NARRATOR.md and MESH_TELEMETRY.md.");
  console.log("\n  drift-report");
  console.log("    Generate comprehensive report combining all audits");
  console.log("    with CLEAN/DRIFTED verdict.");
  console.log("\n  obsidian-export");
  console.log("    Stage drift summary for Obsidian export via the");
  console.log("    Approved Write Gateway.");
  console.log("\n-----------------------------------------");
  console.log("  EXAMPLES:");
  console.log("-----------------------------------------");
  console.log("\n  npm run doc-drift -- \"status\"");
  console.log("  npm run doc-drift -- \"scan-indexes\"");
  console.log("  npm run doc-drift -- \"audit-commands\"");
  console.log("  npm run doc-drift -- \"audit-pointers\"");
  console.log("  npm run doc-drift -- \"audit-narration\"");
  console.log("  npm run doc-drift -- \"drift-report\"");
  console.log("  npm run doc-drift -- \"obsidian-export\"");
  console.log("\n-----------------------------------------");
  console.log("  SAFETY:");
  console.log("-----------------------------------------");
  console.log("  - No system state modifications");
  console.log("  - No external API calls or network requests");
  console.log("  - No automatic fixes or remediation");
  console.log("  - All output is read-only reporting");
  console.log("  - Human approval required for any actions");
  console.log("\n-----------------------------------------");
  console.log("  DRIFT CATEGORIES:");
  console.log("-----------------------------------------");
  console.log("  - stale-pointer: Next Upgrade points to completed phase");
  console.log("  - missing-command-doc: Registry command not in COMMANDS.md");
  console.log("  - missing-npm-script: Registry command has no npm script");
  console.log("  - orphaned-template: Template with no matching module");
  console.log("  - missing-output-dir: Expected output directory missing");
  console.log("  - index-desync: System index file missing or inconsistent");
  console.log("  - missing-voice-command: Voice config not in VOICE_COMMANDS.md");
  console.log("\n-----------------------------------------");
  console.log("  SYSTEM INDEXES MONITORED:");
  console.log("-----------------------------------------");
  console.log("  1. SYSTEM_STATUS.md");
  console.log("  2. COMMANDS.md");
  console.log("  3. VOICE_COMMANDS.md");
  console.log("  4. config/voice-commands.ts");
  console.log("  5. NARRATOR.md");
  console.log("  6. config/narrator-sources.ts");
  console.log("  7. MESH_TELEMETRY.md");
  console.log("  8. dashboard/public/dashboard-data.json");

  console.log("\n-----------------------------------------");
  console.log("  REGISTERED COMMANDS:");
  console.log("-----------------------------------------");
  const targetCmds = COMMAND_REGISTRY.filter(c =>
    c.name.includes('doc-drift') || c.name.includes('documentation-drift')
  );
  for (const cmd of targetCmds) {
    console.log(`\n  Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printDocumentationDriftDetectorHelp();
