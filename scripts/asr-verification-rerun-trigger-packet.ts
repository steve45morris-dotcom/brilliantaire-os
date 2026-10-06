import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  OPERATOR_AUDIT_MANIFEST_DIR,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  REPO_ROOT
} from '../config/asr-verification-rerun-trigger-packet.js';
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

async function runTrigger() {
  console.log("🚦 Starting ASR Verification Rerun Trigger Packet Generator (Phase 11Z-M)...");
  await announcePhrase("Knight standing by. Executing verification rerun trigger packet.");
  await announceIntent("Generating verification rerun trigger packet.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Locate latest operator audit manifest
  const expectedManifestName = `asr_operator_completion_audit_manifest_${dateStr}.json`;
  let manifestPath = path.join(OPERATOR_AUDIT_MANIFEST_DIR, expectedManifestName);

  if (!fs.existsSync(manifestPath)) {
    console.warn(`[Warning] Today's manifest ${expectedManifestName} not found. Searching for latest manifest...`);
    const files = fs.existsSync(OPERATOR_AUDIT_MANIFEST_DIR)
      ? fs.readdirSync(OPERATOR_AUDIT_MANIFEST_DIR).filter(f => f.startsWith('asr_operator_completion_audit_manifest_') && f.endsWith('.json'))
      : [];
    if (files.length === 0) {
      console.error("❌ Failed closed: No operator completion audit manifest exists in outputs/asr_operator_completion_audit/");
      process.exit(1);
    }
    files.sort();
    manifestPath = path.join(OPERATOR_AUDIT_MANIFEST_DIR, files[files.length - 1]);
    console.log(`[Info] Selected latest manifest: ${path.basename(manifestPath)}`);
  } else {
    console.log(`[Info] Selected today's manifest: ${expectedManifestName}`);
  }

  // 2. Read and parse manifest
  let manifestData: any = null;
  try {
    manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed closed: Manifest at ${path.basename(manifestPath)} is not readable or invalid JSON.`);
    process.exit(1);
  }

  // 3. Extract check variables
  const rollup = manifestData.audit_rollup || {};
  const operatorStatus = rollup.operator_packet_completion_status || 'unknown';
  const modelStatus = rollup.required_models_present ? 'present' : 'missing';
  const manifestStatus = rollup.manifests_complete ? 'complete' : 'incomplete';
  const audioStatus = rollup.eligible_audio_files !== undefined ? `${rollup.eligible_audio_files} eligible files` : '0';
  const hasAudio = (rollup.eligible_audio_files || 0) > 0;
  
  const safety = manifestData.safety_locks || {};
  const phase12aLocked = safety.phase_12a_locked !== false; // defaults to true
  const asrExecutionAllowed = safety.asr_called === true;
  const transcriptionAllowed = safety.transcription_generated === true;
  const externalApiAllowed = safety.external_api_called === true;
  const downloadAllowed = safety.download_called === true;

  const manifestBlockers = manifestData.blockers || [];

  // Precondition validations
  const isOperatorReady = operatorStatus === 'ready_for_verification_rerun';
  const isModelStaged = rollup.required_models_present === true && rollup.required_models_readable === true;
  const isManifestComplete = rollup.manifests_complete === true;
  const isAudioStaged = hasAudio;

  const checksPassed =
    isOperatorReady &&
    isModelStaged &&
    isManifestComplete &&
    isAudioStaged &&
    phase12aLocked &&
    !asrExecutionAllowed &&
    !transcriptionAllowed &&
    !externalApiAllowed &&
    !downloadAllowed &&
    !ALLOW_ASR_EXECUTION &&
    !ALLOW_AUDIO_TRANSCRIPTION &&
    !ALLOW_EXTERNAL_API_CALLS &&
    !ALLOW_MODEL_DOWNLOAD;

  let rerunTriggerStatus: 'blocked' | 'ready_to_rerun_validation_chain' = 'blocked';
  let summaryRollup = '';

  const triggerBlockers: string[] = [];

  if (checksPassed) {
    rerunTriggerStatus = 'ready_to_rerun_validation_chain';
    summaryRollup = 'All preconditions met. Verification rerun trigger packet generated successfully. VALIDATION SEQUENCE READY.';
  } else {
    rerunTriggerStatus = 'blocked';
    summaryRollup = 'Preconditions not met. Asset staging verification is INCOMPLETE. VALIDATION SEQUENCE BLOCKED.';
    
    if (!isOperatorReady) triggerBlockers.push(`Operator completion status is '${operatorStatus}' (expected: 'ready_for_verification_rerun')`);
    if (!isModelStaged) triggerBlockers.push('Whisper model files are missing or unreadable in models/asr/whisper/');
    if (!isManifestComplete) triggerBlockers.push('Checksum manifests are incomplete or missing entry configuration');
    if (!isAudioStaged) triggerBlockers.push('No eligible audio candidates staged in recordings/, inputAudio/, or outputs/asr_inputs/');
    if (!phase12aLocked) triggerBlockers.push('Phase 12A safety lock state is UNLOCKED (expected: LOCKED)');
    if (asrExecutionAllowed || ALLOW_ASR_EXECUTION) triggerBlockers.push('ASR execution is ALLOWED (expected: LOCKED/disabled)');
    if (transcriptionAllowed || ALLOW_AUDIO_TRANSCRIPTION) triggerBlockers.push('Speech transcription features are ALLOWED (expected: LOCKED/disabled)');
    if (externalApiAllowed || ALLOW_EXTERNAL_API_CALLS) triggerBlockers.push('External API connections are ALLOWED (expected: LOCKED/disabled)');
    if (downloadAllowed || ALLOW_MODEL_DOWNLOAD) triggerBlockers.push('Model downloads are ALLOWED (expected: LOCKED/disabled)');
  }

  // Include upstream blockers from the audit manifest if there are any
  manifestBlockers.forEach((b: string) => {
    if (!triggerBlockers.includes(b)) {
      triggerBlockers.push(b);
    }
  });

  // Helper: Template Interpolator
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
  // a) Preconditions md
  const preconditionMd = loadAndReplaceTemplate('asr-rerun-precondition-template.md', {
    OPERATOR_STATUS: operatorStatus,
    OPERATOR_STATUS_BADGE: isOperatorReady ? 'PASSED' : 'BLOCKED',
    MODEL_STATUS: rollup.required_models_present ? 'Exist' : 'Missing',
    MODEL_STATUS_BADGE: isModelStaged ? 'PASSED' : 'BLOCKED',
    MANIFEST_STATUS: isManifestComplete ? 'Complete' : 'Incomplete',
    MANIFEST_STATUS_BADGE: isManifestComplete ? 'PASSED' : 'BLOCKED',
    AUDIO_STATUS: audioStatus,
    AUDIO_STATUS_BADGE: isAudioStaged ? 'PASSED' : 'BLOCKED',
    PHASE_12A_STATUS: phase12aLocked ? 'LOCKED' : 'UNLOCKED',
    PHASE_12A_BADGE: phase12aLocked ? 'PASSED' : 'BLOCKED',
    ASR_EXECUTION_STATUS: (asrExecutionAllowed || ALLOW_ASR_EXECUTION) ? 'Allowed' : 'Locked',
    ASR_EXECUTION_BADGE: (asrExecutionAllowed || ALLOW_ASR_EXECUTION) ? 'BLOCKED' : 'PASSED',
    TRANSCRIPTION_STATUS: (transcriptionAllowed || ALLOW_AUDIO_TRANSCRIPTION) ? 'Allowed' : 'Locked',
    TRANSCRIPTION_BADGE: (transcriptionAllowed || ALLOW_AUDIO_TRANSCRIPTION) ? 'BLOCKED' : 'PASSED',
    API_STATUS: (externalApiAllowed || ALLOW_EXTERNAL_API_CALLS) ? 'Allowed' : 'Locked',
    API_STATUS_BADGE: (externalApiAllowed || ALLOW_EXTERNAL_API_CALLS) ? 'BLOCKED' : 'PASSED',
    DOWNLOAD_STATUS: (downloadAllowed || ALLOW_MODEL_DOWNLOAD) ? 'Allowed' : 'Locked',
    DOWNLOAD_STATUS_BADGE: (downloadAllowed || ALLOW_MODEL_DOWNLOAD) ? 'BLOCKED' : 'PASSED',
    RERUN_TRIGGER_STATUS: rerunTriggerStatus.toUpperCase()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_preconditions_${dateStr}.md`), preconditionMd);

  // b) Command Sequence md
  let sequenceListStr = '';
  if (rerunTriggerStatus === 'ready_to_rerun_validation_chain') {
    sequenceListStr += `1. \`npm run command -- "asr-human-staged-asset-verification-pass"\`\n`;
    sequenceListStr += `2. \`npm run command -- "asr-manual-asset-presence-preflight"\`\n`;
    sequenceListStr += `3. \`npm run command -- "asr-checksum-manifest-validation-gate"\`\n`;
    sequenceListStr += `4. \`npm run command -- "asr-audio-input-staging-validation-gate"\`\n`;
    sequenceListStr += `5. \`npm run command -- "asr-readiness-join-gate"\`\n`;
    sequenceListStr += `6. \`npm run command -- "asr-manual-asset-revalidation-pass"\`\n`;
    sequenceListStr += `7. \`npm run command -- "asr-gate-rerun-orchestrator"\`\n`;
  } else {
    sequenceListStr += `> [!IMPORTANT]\n`;
    sequenceListStr += `> Validation chain rerun sequence is BLOCKED. Resolve active blockers to unblock rerun order execution.\n`;
  }
  const commandSequenceMd = loadAndReplaceTemplate('asr-rerun-command-sequence-template.md', {
    COMMAND_SEQUENCE_LIST: sequenceListStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_command_sequence_${dateStr}.md`), commandSequenceMd);

  // c) Safety locks md
  const safetyLocksMd = loadAndReplaceTemplate('asr-rerun-safety-lock-template.md', {
    ASR_EXECUTION_ALLOWED: String(asrExecutionAllowed || ALLOW_ASR_EXECUTION),
    TRANSCRIPTION_ALLOWED: String(transcriptionAllowed || ALLOW_AUDIO_TRANSCRIPTION),
    EXTERNAL_API_ALLOWED: String(externalApiAllowed || ALLOW_EXTERNAL_API_CALLS),
    DOWNLOAD_ALLOWED: String(downloadAllowed || ALLOW_MODEL_DOWNLOAD),
    PHASE_12A_LOCK: phase12aLocked ? 'LOCKED' : 'UNLOCKED'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_safety_lock_${dateStr}.md`), safetyLocksMd);

  // d) Expected outcomes md
  const expectedOutcomesMd = loadAndReplaceTemplate('asr-rerun-expected-outcomes-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_expected_outcomes_${dateStr}.md`), expectedOutcomesMd);

  // e) Blockers checklist md
  let checklistStr = '';
  if (triggerBlockers.length > 0) {
    triggerBlockers.forEach((b, idx) => {
      checklistStr += `- [ ] **Rerun Blocker ${idx + 1}:** ${b}\n`;
    });
  } else {
    checklistStr += `* **No blockers.** Preconditions verified. System ready to trigger full validation sequence.\n`;
  }
  const blockersMd = loadAndReplaceTemplate('asr-rerun-blocker-template.md', {
    BLOCKERS_CHECKLIST: checklistStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_blockers_${dateStr}.md`), blockersMd);

  // f) Summary md
  const summaryMd = loadAndReplaceTemplate('asr-rerun-summary-template.md', {
    SUMMARY_ROLLUP: summaryRollup
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_summary_${dateStr}.md`), summaryMd);

  // g) Next actions md (Next Phase: Phase 11Z-N: Validation Chain Execution Report)
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-N: Validation Chain Execution Report'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // h) Consolidated Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-verification-rerun-trigger-packet-template.md', {
    DATE: dateStr,
    RERUN_PRECONDITIONS: preconditionMd.trim(),
    RERUN_SAFETY_LOCKS: safetyLocksMd.trim(),
    RERUN_COMMAND_SEQUENCE: commandSequenceMd.trim(),
    RERUN_EXPECTED_OUTCOMES: expectedOutcomesMd.trim(),
    RERUN_BLOCKERS: blockersMd.trim(),
    RERUN_SUMMARY: summaryMd.trim(),
    NEXT_ACTION_DETAILS: nextActionsMd.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_verification_rerun_trigger_packet_${dateStr}.md`), masterReportMd);

  // i) Consolidated JSON Manifest
  const jsonManifest = {
    trigger_id: `asr_verification_rerun_trigger_${dateStr}`,
    manifest_version: "1.0",
    generated_date: dateStr,
    trigger_status: rerunTriggerStatus,
    preconditions_summary: {
      operator_packet_completion_status: operatorStatus,
      model_placement_audit_result: modelStatus,
      manifest_completion_audit_result: manifestStatus,
      audio_staging_audit_result: audioStatus,
      phase_12a_lock_status: phase12aLocked ? "LOCKED" : "UNLOCKED",
      asr_execution_status: asrExecutionAllowed || ALLOW_ASR_EXECUTION,
      transcription_generated_status: transcriptionAllowed || ALLOW_AUDIO_TRANSCRIPTION,
      external_api_status: externalApiAllowed || ALLOW_EXTERNAL_API_CALLS,
      download_status: downloadAllowed || ALLOW_MODEL_DOWNLOAD
    },
    blockers: triggerBlockers,
    safety_locks: {
      phase_12a_locked: phase12aLocked,
      asr_called: asrExecutionAllowed || ALLOW_ASR_EXECUTION,
      transcription_generated: transcriptionAllowed || ALLOW_AUDIO_TRANSCRIPTION,
      external_api_called: externalApiAllowed || ALLOW_EXTERNAL_API_CALLS,
      download_called: downloadAllowed || ALLOW_MODEL_DOWNLOAD
    },
    next_action_recommendation: rerunTriggerStatus === 'ready_to_rerun_validation_chain'
      ? "Phase 11Z-N: Validation Chain Execution Report (Trigger validation rerun command sequence)"
      : "Resolve missing staged Whisper binaries and audio assets manually, rerun audit scripts, and recreate trigger packet."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_verification_rerun_trigger_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR VERIFICATION RERUN TRIGGER COMPLETE");
  console.log("=========================================");
  console.log(`Summary Document: outputs/asr_rerun_trigger/asr_verification_rerun_trigger_packet_${dateStr}.md`);
  console.log(`JSON Manifest:    outputs/asr_rerun_trigger/asr_verification_rerun_trigger_manifest_${dateStr}.json`);
  console.log(`Trigger Status:   ${rerunTriggerStatus.toUpperCase()}`);
  console.log("=========================================");

  if (!checksPassed) {
    console.error("❌ Failed closed: Preconditions not met. Asset staging verification is INCOMPLETE.");
    await announceCompletion("ASR verification rerun trigger packet failed (preconditions blocked).", "0");
    process.exit(1);
  } else {
    await announceCompletion("ASR verification rerun trigger packet generated successfully.", "12");
  }
}

runTrigger().catch((err) => {
  console.error(`❌ Verification Rerun Trigger error: ${(err as Error).message}`);
  process.exit(1);
});
