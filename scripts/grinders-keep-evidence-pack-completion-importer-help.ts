import { COMMAND_REGISTRY } from '../config/commands.js';

function printEvidencePackCompletionImporterHelp() {
  console.log("=========================================");
  console.log("📥 GRINDERS KEEP EVIDENCE PACK COMPLETION IMPORTER - HELP");
  console.log("=========================================");
  console.log("This module scans the inputs/grinders_keep/evidence_collection/ folders to see");
  console.log("if any of the requested evidence pack items have been manually placed. It imports");
  console.log("their status and prepares the completion tracker feed without mutating evidence.");
  console.log("\nCore Safety Rules Enforced:");
  console.log("  1. Read-Only Scan: Scans folders and logs status without moving or copying files.");
  console.log("  2. Local-First: Zero external web API queries or automated model requests.");
  console.log("  3. Safety Gated: file_move_allowed, file_copy_allowed, and evidence_creation_allowed are locked to false.");
  console.log("\n📋 Registered commands for Evidence Pack Completion Importer:");

  const targetCmds = COMMAND_REGISTRY.filter(c => c.name.includes('grinders-keep-evidence-pack-completion-importer'));
  for (const cmd of targetCmds) {
    console.log(`\n🔹 Command: npm run command -- "${cmd.name}"`);
    console.log(`   Description: ${cmd.description}`);
    console.log(`   Owning Agent: ${cmd.owningAgent}`);
    console.log(`   Risk Level:   ${cmd.riskLevel.toUpperCase()}`);
  }
  console.log("\n=========================================");
}

printEvidencePackCompletionImporterHelp();
