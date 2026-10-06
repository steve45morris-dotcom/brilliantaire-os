import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  EXPECTED_MODELS,
  EXPECTED_MODEL_DIRECTORY,
  CHECKSUM_MANIFEST_FILES,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  ALLOWED_AUDIO_EXTENSIONS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  REPO_ROOT
} from '../config/asr-manual-asset-staging-operator-packet.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Formatted Date YYYY-MM-DD
function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runPacketGenerator() {
  console.log("🚦 Starting ASR Manual Asset Staging Operator Packet Generator (Phase 11Z-K)...");
  await announcePhrase("Knight standing by. Constructing human operator staging instructions.");
  await announceIntent("Generating ASR manual asset staging operator packet guides.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // Template interpolation helper
  const loadAndReplaceTemplate = (templateName: string, replacements: Record<string, string>): string => {
    const tempPath = path.join(TEMPLATE_DIRECTORY, templateName);
    if (!fs.existsSync(tempPath)) {
      throw new Error(`Template not found: ${tempPath}`);
    }
    let content = fs.readFileSync(tempPath, 'utf-8');
    for (const [key, value] of Object.entries(replacements)) {
      content = content.split(`{{${key}}}`).join(value);
    }
    return content;
  };

  // Compile individual templates
  // 1. Model placement commands
  const modelPlacementMd = loadAndReplaceTemplate('asr-model-placement-commands-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_placement_commands_${dateStr}.md`), modelPlacementMd);

  // 2. SHA256 capture commands
  const sha256CaptureMd = loadAndReplaceTemplate('asr-sha256-capture-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_sha256_capture_${dateStr}.md`), sha256CaptureMd);

  // 3. File size capture commands
  const fileSizeCaptureMd = loadAndReplaceTemplate('asr-file-size-capture-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_file_size_capture_${dateStr}.md`), fileSizeCaptureMd);

  // 4. Manifest update guide
  const manifestUpdateGuideMd = loadAndReplaceTemplate('asr-manifest-update-guide-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_manifest_update_guide_${dateStr}.md`), manifestUpdateGuideMd);

  // 5. Audio placement guide
  const audioPlacementGuideMd = loadAndReplaceTemplate('asr-audio-placement-guide-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_placement_guide_${dateStr}.md`), audioPlacementGuideMd);

  // 6. Post-staging rerun guide
  const postStagingRerunGuideMd = loadAndReplaceTemplate('asr-post-staging-rerun-guide-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_post_staging_rerun_guide_${dateStr}.md`), postStagingRerunGuideMd);

  // 7. Lock reminder
  const phase12aLockReminderMd = loadAndReplaceTemplate('asr-phase-12a-lock-reminder-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_phase_12a_lock_reminder_${dateStr}.md`), phase12aLockReminderMd);

  // 8. Next actions (next phase: Phase 11Z-L: Operator Packet Completion Audit)
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-L: Operator Packet Completion Audit'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // Assemble the Master Operator Packet Guide
  const combinedModelPlacementDetails = `
${modelPlacementMd.trim()}

${sha256CaptureMd.trim()}

${fileSizeCaptureMd.trim()}
`.trim();

  const masterPacketMd = loadAndReplaceTemplate('asr-operator-packet-template.md', {
    DATE: dateStr,
    MODEL_PL_GUIDE: combinedModelPlacementDetails,
    MANIFEST_UP_GUIDE: manifestUpdateGuideMd.trim(),
    AUDIO_PL_GUIDE: audioPlacementGuideMd.trim(),
    POST_ST_RERUN: postStagingRerunGuideMd.trim(),
    PHASE_12A_L_REM: phase12aLockReminderMd.trim(),
    NEXT_ACTION_DETAILS: nextActionsMd.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_packet_${dateStr}.md`), masterPacketMd);

  // Rerun sequence list for manifest
  const rerunSequence = [
    'npm run command -- "asr-human-staged-asset-verification-pass"',
    'npm run command -- "asr-manual-asset-presence-preflight"',
    'npm run command -- "asr-checksum-manifest-validation-gate"',
    'npm run command -- "asr-audio-input-staging-validation-gate"',
    'npm run command -- "asr-readiness-join-gate"',
    'npm run command -- "asr-manual-asset-revalidation-pass"',
    'npm run command -- "asr-gate-rerun-orchestrator"'
  ];

  // Write Consolidated JSON Manifest Ledger
  const jsonManifest = {
    ledger_id: `asr_operator_packet_${dateStr}`,
    manifest_version: "1.0",
    generation_date: dateStr,
    operator_requirements: {
      required_models: EXPECTED_MODELS,
      destination_folder: EXPECTED_MODEL_DIRECTORY,
      checksum_manifests: CHECKSUM_MANIFEST_FILES,
      approved_audio_folders: APPROVED_AUDIO_INPUT_DIRECTORIES,
      accepted_audio_extensions: ALLOWED_AUDIO_EXTENSIONS
    },
    post_staging_rerun_sequence: rerunSequence,
    safety_locks: {
      phase_12a_locked: true,
      asr_called: ALLOW_ASR_EXECUTION,
      transcription_generated: ALLOW_AUDIO_TRANSCRIPTION,
      external_api_called: ALLOW_EXTERNAL_API_CALLS,
      download_called: ALLOW_MODEL_DOWNLOAD
    },
    next_action: "Distribute this operator packet to human operator for manual asset placement, manifest checksum updates, and audio staging, then proceed to Phase 11Z-L audit."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_operator_packet_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR OPERATOR PACKET GENERATOR COMPLETE");
  console.log("=========================================");
  console.log(`Summary Document: outputs/asr_operator_packet/asr_operator_packet_${dateStr}.md`);
  console.log(`JSON Manifest:    outputs/asr_operator_packet/asr_operator_packet_manifest_${dateStr}.json`);
  console.log(`Required Models:  ${EXPECTED_MODELS.join(', ')}`);
  console.log(`Destination:      ${EXPECTED_MODEL_DIRECTORY}`);
  console.log("=========================================");

  await announceCompletion("ASR manual asset staging operator packet generated successfully.", "12");
}

runPacketGenerator().catch((err) => {
  console.error(`❌ Operator Packet Generator error: ${(err as Error).message}`);
  process.exit(1);
});
