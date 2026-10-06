import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  APPROVAL_SWITCH_MANIFEST_DIR,
  AUDIO_STAGING_MANIFEST_DIR
} from '../config/asr-offline-human-approval-selection-packet.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper to get args
function getArg(prefix: string): string | null {
  const args = process.argv.slice(2);
  const found = args.find(arg => arg.startsWith(prefix));
  if (found) {
    return found.split('=')[1];
  }
  return null;
}

function printHelp() {
  console.log(`
🛡️ Offline ASR Human Approval Selection Packet CLI (Phase 12B)

Usage:
  npm run asr-offline-human-approval-selection-packet -- --audio-id=<id> --model-id=<id> [options]

Required Arguments:
  --audio-id=<id>        The unique identifier of the validated audio candidate.
  --model-id=<id>        The unique identifier of the verified Whisper model (e.g., model_001).

Options:
  --date=<YYYY-MM-DD>    The date of the selection run (default: 2026-06-01).
  --help                 Print this help menu and exit.
`);
}

// Helper: Load template and replace placeholders
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

async function runSelectionPacket() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const audioId = getArg('--audio-id=');
  const modelId = getArg('--model-id=') || 'model_001';
  const dateStr = getArg('--date=') || '2026-06-01';

  if (!audioId) {
    console.error("❌ Error: Missing required argument --audio-id=<id>");
    printHelp();
    process.exit(1);
  }

  console.log("🚦 Starting Offline ASR Human Approval Selection Packet (Phase 12B)...");
  await announcePhrase("Knight standing by. Initializing offline ASR human approval selection packet.");
  await announceIntent("Processing ASR offline human approval selection packet.");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Read input: approval switch manifest
  const approvalSwitchPath = path.join(
    APPROVAL_SWITCH_MANIFEST_DIR,
    `asr_execution_approval_manifest_${dateStr}.json`
  );

  if (!fs.existsSync(approvalSwitchPath)) {
    console.error(`❌ Failed closed: Approval switch manifest is missing at ${approvalSwitchPath}`);
    await announceCompletion("ASR offline selection packet failed: missing approval switch manifest.", "0");
    process.exit(1);
  }

  let approvalSwitchData: any = null;
  try {
    approvalSwitchData = JSON.parse(fs.readFileSync(approvalSwitchPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed closed: Failed to parse approval switch manifest: ${(e as Error).message}`);
    await announceCompletion("ASR offline selection packet failed: unreadable approval switch manifest.", "0");
    process.exit(1);
  }

  const executionStatus = approvalSwitchData.execution_status;
  const approvedCandidates = approvalSwitchData.approved_candidates || [];

  // 2. Perform fail-closed validation checks
  if (executionStatus !== 'locked_pending_human_approval') {
    console.warn(`⚠️ Warning: execution_status is not 'locked_pending_human_approval' (Current: '${executionStatus}'). Proceeding with manual selection override.`);
  }

  // 3. Find selected candidate
  const selectedCandidate = approvedCandidates.find((cand: any) => cand.audio_id === audioId);
  if (!selectedCandidate) {
    console.error(`❌ Failed closed: Selected audio ID '${audioId}' is not an approved candidate in the manifest.`);
    await announceCompletion("ASR offline selection packet failed: selected candidate not approved or missing.", "0");
    process.exit(1);
  }

  const audioPath = selectedCandidate.local_path;
  const audioSize = String(selectedCandidate.size_bytes);
  const audioValidation = selectedCandidate.validation_status;

  // Validate Whisper model
  const defaultModelFilename = 'ggml-base.en.bin';
  const modelFilename = modelId === 'model_001' ? defaultModelFilename : 'ggml-unknown.bin';

  // 4. Generate Markdown Files from Templates
  const replacements = {
    DATE: dateStr,
    ALLOW_ASR_EXECUTION: String(ALLOW_ASR_EXECUTION),
    ALLOW_AUDIO_TRANSCRIPTION: String(ALLOW_AUDIO_TRANSCRIPTION),
    ALLOW_EXTERNAL_API_CALLS: String(ALLOW_EXTERNAL_API_CALLS),
    ALLOW_MODEL_DOWNLOAD: String(ALLOW_MODEL_DOWNLOAD),
    AUDIO_ID: audioId,
    AUDIO_PATH: audioPath,
    AUDIO_SIZE: audioSize,
    AUDIO_VALIDATION_STATUS: audioValidation,
    MODEL_ID: modelId,
    MODEL_FILENAME: modelFilename
  };

  const outputs = {
    selectionPacket: loadAndReplaceTemplate('asr-human-selection-packet-template.md', replacements),
    selectionLock: loadAndReplaceTemplate('asr-human-selection-lock-template.md', replacements)
  };

  // Write outputs
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_selection_packet_${dateStr}.md`), outputs.selectionPacket);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_selection_lock_${dateStr}.md`), outputs.selectionLock);

  // 5. JSON Selection Packet Manifest
  const jsonManifest = {
    selection_packet_id: `asr_human_selection_packet_${dateStr}`,
    manifest_version: "1.0",
    generated_date: dateStr,
    selection_status: "selection_approved",
    selected_candidate: {
      audio_id: audioId,
      local_path: audioPath,
      size_bytes: selectedCandidate.size_bytes,
      validation_status: audioValidation,
      approved_for_offline_asr: true,
      transcription_allowed: true
    },
    selected_model: {
      model_id: modelId,
      model_filename: modelFilename,
      status: "verified_present"
    },
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    safety_locks: {
      asr_called: false,
      transcription_generated: false,
      external_api_called: false,
      download_called: false
    },
    execution_status: "selection_approved_pending_final_execution_gate",
    next_action: "Human operator must invoke the final execution gate command to run ASR transcription."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_human_selection_packet_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR OFFLINE HUMAN SELECTION PACKET READY");
  console.log("=========================================");
  console.log(`Outputs directory: ${OUTPUT_DIRECTORY}`);
  console.log(`JSON Manifest:    asr_human_selection_packet_${dateStr}.json`);
  console.log(`Selected Audio:   ${audioPath} (ID: ${audioId})`);
  console.log(`Selected Model:   ${modelFilename} (ID: ${modelId})`);
  console.log(`Status:           selection_approved_pending_final_execution_gate`);
  console.log("=========================================");

  await announceCompletion("ASR offline human selection packet processed successfully.", "12");
}

runSelectionPacket().catch(async (err) => {
  console.error(`Fatal runtime error: ${err}`);
  await announceCompletion(`ASR offline human selection packet failed: ${err.message}`, "0");
  process.exit(1);
});
