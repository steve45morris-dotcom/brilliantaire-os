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
  VALIDATION_CHAIN_MANIFEST_DIR,
  AUDIO_STAGING_MANIFEST_DIR
} from '../config/asr-offline-execution-approval-switch.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper to get date string from command line arguments or default to 2026-06-01
function getDateFromArgs(): string {
  const args = process.argv.slice(2);
  const dateArg = args.find(arg => arg.startsWith('--date='));
  if (dateArg) {
    return dateArg.split('=')[1];
  }
  return '2026-06-01';
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

async function runApprovalSwitch() {
  console.log("🚦 Starting Offline ASR Execution Approval Switch (Phase 12A)...");
  await announcePhrase("Knight standing by. Initializing offline ASR execution approval switch.");
  await announceIntent("Processing ASR offline execution approval switch.");

  const dateStr = getDateFromArgs();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Read primary input: validation chain manifest
  const validationChainPath = path.join(
    VALIDATION_CHAIN_MANIFEST_DIR,
    `asr_validation_chain_manifest_${dateStr}.json`
  );

  if (!fs.existsSync(validationChainPath)) {
    console.error(`❌ Failed closed: Validation chain manifest is missing at ${validationChainPath}`);
    await announceCompletion("ASR offline approval switch failed: missing validation chain manifest.", "0");
    process.exit(1);
  }

  let validationChainData: any = null;
  try {
    validationChainData = JSON.parse(fs.readFileSync(validationChainPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed closed: Failed to parse validation chain manifest: ${(e as Error).message}`);
    await announceCompletion("ASR offline approval switch failed: unreadable validation chain manifest.", "0");
    process.exit(1);
  }

  const validationChainStatus = validationChainData.validation_chain_status;
  const safetyLocks = validationChainData.safety_locks || {};

  // 2. Perform fail-closed validation checks
  if (validationChainStatus !== 'dry_run_ready') {
    console.error(`❌ Failed closed: validation_chain_status is not 'dry_run_ready' (Current: '${validationChainStatus}').`);
    await announceCompletion("ASR offline approval switch failed: validation chain status blocked.", "0");
    process.exit(1);
  }

  if (ALLOW_ASR_EXECUTION === true || safetyLocks.asr_called === true) {
    console.error(`❌ Failed closed: ASR execution is enabled. Switch requires ASR execution to be disabled.`);
    await announceCompletion("ASR offline approval switch failed: ASR execution safety lock breached.", "0");
    process.exit(1);
  }

  if (ALLOW_AUDIO_TRANSCRIPTION === true || safetyLocks.transcription_generated === true) {
    console.error(`❌ Failed closed: Transcription generated is enabled. Switch requires transcription to be disabled.`);
    await announceCompletion("ASR offline approval switch failed: transcription safety lock breached.", "0");
    process.exit(1);
  }

  if (ALLOW_EXTERNAL_API_CALLS === true || safetyLocks.external_api_called === true) {
    console.error(`❌ Failed closed: External API calls are enabled. Switch requires external API calls to be disabled.`);
    await announceCompletion("ASR offline approval switch failed: external API safety lock breached.", "0");
    process.exit(1);
  }

  if (ALLOW_MODEL_DOWNLOAD === true || safetyLocks.download_called === true) {
    console.error(`❌ Failed closed: Model downloads are enabled. Switch requires downloads to be disabled.`);
    await announceCompletion("ASR offline approval switch failed: download safety lock breached.", "0");
    process.exit(1);
  }

  // 3. Read approved audio candidates from the audio staging manifest
  const audioStagingPath = path.join(
    AUDIO_STAGING_MANIFEST_DIR,
    `asr_audio_staging_manifest_${dateStr}.json`
  );

  if (!fs.existsSync(audioStagingPath)) {
    console.error(`❌ Failed closed: Audio staging manifest is missing at ${audioStagingPath}`);
    await announceCompletion("ASR offline approval switch failed: missing audio staging manifest.", "0");
    process.exit(1);
  }

  let audioStagingData: any = null;
  try {
    audioStagingData = JSON.parse(fs.readFileSync(audioStagingPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed closed: Failed to parse audio staging manifest: ${(e as Error).message}`);
    await announceCompletion("ASR offline approval switch failed: unreadable audio staging manifest.", "0");
    process.exit(1);
  }

  const scannedFiles = audioStagingData.scanned_audio_files || [];
  const approvedCandidates: any[] = [];
  const rejectedCandidates: any[] = [];

  const approvedFolders = ['recordings', 'inputAudio', 'outputs/asr_inputs'];

  for (const file of scannedFiles) {
    const fileId = file.file_id || 'audio_unknown';
    const filename = file.filename || '';
    const localPath = file.local_path || '';
    const extension = file.extension || '';
    const sizeBytes = file.size_bytes || 0;
    const sourceFolder = file.directory_source || '';
    const eligibilityStatus = file.eligibility_status || 'blocked';

    const fullFilePath = path.join(REPO_ROOT, localPath);
    let isRejected = false;
    let rejectReason = '';

    // Verify rejection rules
    if (validationChainStatus !== 'dry_run_ready') {
      isRejected = true;
      rejectReason = 'validation_chain_status is not dry_run_ready';
    } else if (!fs.existsSync(fullFilePath)) {
      isRejected = true;
      rejectReason = `audio file is missing at ${localPath}`;
    } else if (sizeBytes === 0) {
      isRejected = true;
      rejectReason = 'audio file size is 0 bytes';
    } else if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      isRejected = true;
      rejectReason = 'audio filename is unsafe';
    } else if (!approvedFolders.some(folder => localPath.startsWith(folder))) {
      isRejected = true;
      rejectReason = 'audio path lies outside approved staging directories';
    } else if (eligibilityStatus !== 'eligible') {
      isRejected = true;
      rejectReason = `staging eligibility status is '${eligibilityStatus}'`;
    }

    if (isRejected) {
      rejectedCandidates.push({
        audio_id: fileId,
        filename,
        local_path: localPath,
        extension,
        size_bytes: sizeBytes,
        source_folder: sourceFolder,
        validation_status: 'rejected',
        approval_status: 'rejected_by_system_rules',
        approved_for_offline_asr: false,
        human_approval_required: true,
        transcription_allowed: false,
        rejection_reason: rejectReason,
        next_action: 'Resolve validation blocker or relocate audio file to approved directories.'
      });
    } else {
      approvedCandidates.push({
        audio_id: fileId,
        filename,
        local_path: localPath,
        extension,
        size_bytes: sizeBytes,
        source_folder: sourceFolder,
        validation_status: eligibilityStatus,
        approval_status: 'pending_operator_approval',
        approved_for_offline_asr: false,
        human_approval_required: true,
        transcription_allowed: false,
        next_action: 'Awaiting manual human operator approval checklist signature.'
      });
    }
  }

  // 4. Generate manifest entries
  const manifestMappings: any[] = [];
  const approvalsListMd: string[] = [];
  const rejectionsListMd: string[] = [];

  const defaultModelId = 'model_001';
  const defaultModelFilename = 'ggml-base.en.bin';

  approvedCandidates.forEach(cand => {
    manifestMappings.push({
      approval_id: `asr_execution_approval_${dateStr}`,
      audio_id: cand.audio_id,
      local_path: cand.local_path,
      model_id: defaultModelId,
      model_filename: defaultModelFilename,
      validation_chain_status: validationChainStatus,
      approved_for_offline_asr: false,
      human_approval_required: true,
      approval_source: null,
      approval_timestamp: null,
      transcription_allowed: false,
      whisper_call_allowed: false,
      external_api_allowed: false,
      download_allowed: false,
      execution_status: 'locked_pending_human_approval',
      next_action: 'Human operator must manually sign the ASR human approval checklist to authorize this switch.'
    });

    approvalsListMd.push(
      `* **Candidate ID:** \`${cand.audio_id}\`\n` +
      `  * **Filename:** \`${cand.filename}\`\n` +
      `  * **Local Path:** \`${cand.local_path}\`\n` +
      `  * **Size:** \`${cand.size_bytes} bytes\`\n` +
      `  * **Validation Status:** \`${cand.validation_status}\`\n` +
      `  * **Approved for Offline ASR:** \`false\` (Default locked)\n` +
      `  * **Next Action:** \`${cand.next_action}\``
    );
  });

  rejectedCandidates.forEach(cand => {
    rejectionsListMd.push(
      `* **Candidate ID:** \`${cand.audio_id}\`\n` +
      `  * **Filename:** \`${cand.filename}\`\n` +
      `  * **Local Path:** \`${cand.local_path}\`\n` +
      `  * **Rejection Reason:** \`${cand.rejection_reason}\`\n` +
      `  * **Next Action:** \`${cand.next_action}\``
    );
  });

  const approvedCandidatesListStr = approvalsListMd.length > 0 ? approvalsListMd.join('\n\n') : '*None discovered.*';
  const rejectedCandidatesListStr = rejectionsListMd.length > 0 ? rejectionsListMd.join('\n\n') : '*None discovered.*';

  // Format approvals manifest mapping table/list
  let mappingsStr = '';
  if (manifestMappings.length === 0) {
    mappingsStr = '*No mappings created.*';
  } else {
    manifestMappings.forEach(m => {
      mappingsStr +=
        `### Candidate: ${m.local_path}\n` +
        `| Property | Default Value |\n` +
        `| --- | --- |\n` +
        `| **Approval ID** | \`${m.approval_id}\` |\n` +
        `| **Audio ID** | \`${m.audio_id}\` |\n` +
        `| **Local Path** | \`${m.local_path}\` |\n` +
        `| **Model ID** | \`${m.model_id}\` |\n` +
        `| **Model Filename** | \`${m.model_filename}\` |\n` +
        `| **Validation Status** | \`${m.validation_chain_status}\` |\n` +
        `| **Approved for Offline ASR** | \`${m.approved_for_offline_asr}\` |\n` +
        `| **Human Approval Required** | \`${m.human_approval_required}\` |\n` +
        `| **Approval Source** | \`null\` |\n` +
        `| **Approval Timestamp** | \`null\` |\n` +
        `| **Transcription Allowed** | \`${m.transcription_allowed}\` |\n` +
        `| **Whisper Call Allowed** | \`${m.whisper_call_allowed}\` |\n` +
        `| **External API Allowed** | \`${m.external_api_allowed}\` |\n` +
        `| **Download Allowed** | \`${m.download_allowed}\` |\n` +
        `| **Execution Status** | \`${m.execution_status}\` |\n` +
        `| **Next Action** | \`${m.next_action}\` |\n\n`;
    });
  }

  // 5. Generate Markdown Files from Templates
  const replacements = {
    DATE: dateStr,
    ALLOW_ASR_EXECUTION: String(ALLOW_ASR_EXECUTION),
    ALLOW_AUDIO_TRANSCRIPTION: String(ALLOW_AUDIO_TRANSCRIPTION),
    ALLOW_EXTERNAL_API_CALLS: String(ALLOW_EXTERNAL_API_CALLS),
    ALLOW_MODEL_DOWNLOAD: String(ALLOW_MODEL_DOWNLOAD),
    VALIDATION_CHAIN_STATUS: validationChainStatus,
    DISCOVERED_COUNT: String(scannedFiles.length),
    APPROVED_COUNT: String(approvedCandidates.length),
    REJECTED_COUNT: String(rejectedCandidates.length),
    EXECUTION_STATUS: 'locked_pending_human_approval',
    APPROVED_CANDIDATES_LIST: approvedCandidatesListStr,
    REJECTED_CANDIDATES_LIST: rejectedCandidatesListStr,
    APPROVAL_MAPPINGS: mappingsStr
  };

  const outputs = {
    switchReport: loadAndReplaceTemplate('asr-execution-approval-switch-template.md', replacements),
    approvedCandidates: loadAndReplaceTemplate('asr-approved-audio-candidate-template.md', replacements),
    rejectedCandidates: loadAndReplaceTemplate('asr-rejected-audio-candidate-template.md', replacements),
    approvalManifest: loadAndReplaceTemplate('asr-approval-manifest-template.md', replacements),
    executionLock: loadAndReplaceTemplate('asr-execution-lock-template.md', replacements),
    checklist: loadAndReplaceTemplate('asr-human-approval-checklist-template.md', replacements),
    nextActions: loadAndReplaceTemplate('asr-next-actions-template.md', replacements)
  };

  // Write outputs
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_execution_approval_switch_${dateStr}.md`), outputs.switchReport);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_approved_audio_candidates_${dateStr}.md`), outputs.approvedCandidates);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rejected_audio_candidates_${dateStr}.md`), outputs.rejectedCandidates);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_approval_manifest_${dateStr}.md`), outputs.approvalManifest);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_execution_lock_${dateStr}.md`), outputs.executionLock);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_approval_checklist_${dateStr}.md`), outputs.checklist);
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), outputs.nextActions);

  // JSON manifest
  const jsonManifest = {
    approval_switch_id: `asr_execution_approval_switch_${dateStr}`,
    manifest_version: "1.0",
    generated_date: dateStr,
    validation_chain_status: validationChainStatus,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    metrics: {
      discovered_candidates: scannedFiles.length,
      approved_candidates: approvedCandidates.length,
      rejected_candidates: rejectedCandidates.length
    },
    approved_candidates: approvedCandidates,
    rejected_candidates: rejectedCandidates,
    switch_mappings: manifestMappings,
    safety_locks: {
      asr_execution_status: false,
      transcription_generated: false,
      external_api_calls: false,
      downloads: false
    },
    execution_status: "locked_pending_human_approval",
    next_action: "Human operator must manually sign the ASR human approval checklist to authorize this switch."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_execution_approval_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR OFFLINE EXECUTION APPROVAL SWITCH READY");
  console.log("=========================================");
  console.log(`Outputs directory: ${OUTPUT_DIRECTORY}`);
  console.log(`JSON Manifest:    asr_execution_approval_manifest_${dateStr}.json`);
  console.log(`Status:           locked_pending_human_approval`);
  console.log("=========================================");

  await announceCompletion("ASR offline execution approval switch processed successfully.", "12");
}

runApprovalSwitch().catch(async (err) => {
  console.error(`Fatal runtime error: ${err}`);
  await announceCompletion(`ASR offline execution approval switch failed: ${err.message}`, "0");
  process.exit(1);
});
