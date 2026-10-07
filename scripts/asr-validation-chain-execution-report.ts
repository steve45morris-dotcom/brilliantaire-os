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
  RERUN_TRIGGER_DIR,
  HUMAN_STAGED_VERIFICATION_DIR,
  ASSET_PREFLIGHT_DIR,
  CHECKSUM_VALIDATION_DIR,
  AUDIO_STAGING_DIR,
  READINESS_JOIN_DIR,
  REVALIDATION_DIR,
  GATE_RERUN_DIR
} from '../config/asr-validation-chain-execution-report.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get date string from command line arguments or default to today's date
function getDateFromArgs(): string {
  const args = process.argv.slice(2);
  const dateArg = args.find(arg => arg.startsWith('--date='));
  if (dateArg) {
    return dateArg.split('=')[1];
  }
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runValidationChainReport() {
  console.log("🚦 Starting ASR Validation Chain Execution Report (Phase 11Z-N)...");
  await announcePhrase("Knight standing by. Executing validation chain report.");
  await announceIntent("Evaluating validation chain execution report.");

  const dateStr = getDateFromArgs();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Locate and parse rerun trigger manifest
  const triggerManifestName = `asr_verification_rerun_trigger_manifest_${dateStr}.json`;
  const triggerManifestPath = path.join(RERUN_TRIGGER_DIR, triggerManifestName);

  if (!fs.existsSync(triggerManifestPath)) {
    console.error(`❌ Failed closed: Rerun trigger manifest is missing at outputs/asr_rerun_trigger/${triggerManifestName}`);
    await announceCompletion("ASR validation chain execution report failed: missing trigger manifest.", "0");
    process.exit(1);
  }

  let triggerData: any = null;
  try {
    triggerData = JSON.parse(fs.readFileSync(triggerManifestPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Failed closed: Failed to parse rerun trigger manifest at ${path.basename(triggerManifestPath)}: ${(e as Error).message}`);
    await announceCompletion("ASR validation chain execution report failed: unreadable trigger manifest.", "0");
    process.exit(1);
  }

  // Read preconditions from trigger data
  const triggerStatus = triggerData.trigger_status || 'blocked';
  const preconSummary = triggerData.preconditions_summary || {};
  const operatorStatus = preconSummary.operator_packet_completion_status || 'blocked';
  
  // Model Staging Status check
  const modelStagingStatus = preconSummary.model_placement_audit_result || 'missing';
  // Audio Staging Status check
  const audioStagingStatusRaw = preconSummary.audio_staging_audit_result || '';
  const audioStagingStatus = (audioStagingStatusRaw.includes('0') || audioStagingStatusRaw.toLowerCase().includes('empty')) ? 'empty' : 'staged';
  // Phase 12A Lock Status check
  const phase12aLockStatus = preconSummary.phase_12a_lock_status || 'LOCKED';

  console.log(`[Info] Rerun Trigger Status: ${triggerStatus}`);
  console.log(`[Info] Operator Status: ${operatorStatus}`);
  console.log(`[Info] Model Staging Status: ${modelStagingStatus}`);
  console.log(`[Info] Audio Staging Status: ${audioStagingStatus}`);
  console.log(`[Info] Phase 12A Lock Status: ${phase12aLockStatus}`);

  // Precondition gate checks
  const isTriggerReady = triggerStatus === 'ready_to_rerun_validation_chain';
  const isModelPresent = modelStagingStatus !== 'missing';
  const isAudioStaged = audioStagingStatus !== 'empty';
  const isPhase12aLocked = phase12aLockStatus === 'LOCKED';

  // Read external manifest files to gather gate step status
  const manifestPaths = {
    human_staged_verification: path.join(HUMAN_STAGED_VERIFICATION_DIR, `asr_human_staged_verification_manifest_${dateStr}.json`),
    preflight: path.join(ASSET_PREFLIGHT_DIR, `asr_asset_preflight_manifest_${dateStr}.json`),
    checksum_validation: path.join(CHECKSUM_VALIDATION_DIR, `asr_checksum_validation_manifest_${dateStr}.json`),
    audio_staging: path.join(AUDIO_STAGING_DIR, `asr_audio_staging_manifest_${dateStr}.json`),
    readiness_join: path.join(READINESS_JOIN_DIR, `asr_readiness_join_manifest_${dateStr}.json`),
    revalidation: path.join(REVALIDATION_DIR, `asr_revalidation_manifest_${dateStr}.json`),
    gate_rerun: path.join(GATE_RERUN_DIR, `asr_gate_rerun_manifest_${dateStr}.json`)
  };

  // Check safety requirements across all manifests
  let asrCalled = false;
  let transcriptionGenerated = false;
  let externalApiCalled = false;
  let downloadCalled = false;

  const stepResults: any[] = [];
  const consolidatedBlockers: string[] = [];

  // Helper: Read and parse JSON safely, or return null
  const tryReadJson = (p: string): any => {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
        // Accumulate safety flag breaches
        if (data.safety_locks || data.gate_configuration) {
          const s = data.safety_locks || data.gate_configuration;
          if (s.asr_called === true || s.ALLOW_ASR_EXECUTION === true) asrCalled = true;
          if (s.transcription_generated === true || s.ALLOW_AUDIO_TRANSCRIPTION === true) transcriptionGenerated = true;
          if (s.external_api_called === true || s.ALLOW_EXTERNAL_API_CALLS === true) externalApiCalled = true;
          if (s.download_called === true || s.ALLOW_MODEL_DOWNLOAD === true) downloadCalled = true;
        }
        if (data.asr_called === true) asrCalled = true;
        if (data.transcription_generated === true) transcriptionGenerated = true;
        if (data.external_api_called === true) externalApiCalled = true;
        if (data.download_called === true) downloadCalled = true;

        return data;
      } catch {
        return null;
      }
    }
    return null;
  };

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

  // Step 1: asr-human-staged-asset-verification-pass
  const verifyManifest = tryReadJson(manifestPaths.human_staged_verification);
  const verifyStatus = verifyManifest?.verification_rollup?.human_staged_verification_status || 'blocked';
  const verifyBlockers = verifyManifest?.blockers || [];
  stepResults.push({
    step_id: 1,
    command_name: 'asr-human-staged-asset-verification-pass',
    source_manifest: path.basename(manifestPaths.human_staged_verification),
    execution_mode: 'manifest_read',
    step_status: verifyStatus,
    blockers: verifyBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: verifyManifest?.next_action || 'Staging verify manually and update checklists.'
  });
  if (verifyStatus !== 'ready_for_gate_rerun') {
    verifyBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 1 Blocker: ${b}`));
  }

  // Step 2: asr-manual-asset-presence-preflight
  const preflightManifest = tryReadJson(manifestPaths.preflight);
  const preflightStatus = preflightManifest?.preflight_status || 'blocked';
  const preflightBlockers = preflightManifest?.blockers || [];
  stepResults.push({
    step_id: 2,
    command_name: 'asr-manual-asset-presence-preflight',
    source_manifest: path.basename(manifestPaths.preflight),
    execution_mode: 'manifest_read',
    step_status: preflightStatus,
    blockers: preflightBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: preflightManifest?.next_action || 'Complete presence checklist parameters.'
  });
  if (preflightStatus !== 'ready_for_revalidation') {
    preflightBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 2 Blocker: ${b}`));
  }

  // Step 3: asr-checksum-manifest-validation-gate
  const checksumManifest = tryReadJson(manifestPaths.checksum_validation);
  const checksumStatus = checksumManifest?.checks_metrics?.final_model_trust_status || 'blocked';
  const checksumBlockers = checksumManifest?.gate_errors || checksumManifest?.blockers || [];
  stepResults.push({
    step_id: 3,
    command_name: 'asr-checksum-manifest-validation-gate',
    source_manifest: path.basename(manifestPaths.checksum_validation),
    execution_mode: 'manifest_read',
    step_status: checksumStatus,
    blockers: checksumBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: checksumManifest?.next_action || 'Check model hashes in integrity files.'
  });
  if (checksumStatus !== 'dry_run_ready') {
    checksumBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 3 Blocker: ${b}`));
  }

  // Step 4: asr-audio-input-staging-validation-gate
  const audioManifest = tryReadJson(manifestPaths.audio_staging);
  const audioStatus = audioManifest?.audio_readiness_metrics?.final_audio_staging_gate_state || 'blocked';
  const audioBlockers = audioManifest?.blockers || [];
  stepResults.push({
    step_id: 4,
    command_name: 'asr-audio-input-staging-validation-gate',
    source_manifest: path.basename(manifestPaths.audio_staging),
    execution_mode: 'manifest_read',
    step_status: audioStatus,
    blockers: audioBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: audioManifest?.next_action || 'Stage accepted audio drop files.'
  });
  if (audioStatus !== 'staged_ready') {
    audioBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 4 Blocker: ${b}`));
  }

  // Step 5: asr-readiness-join-gate
  const readinessManifest = tryReadJson(manifestPaths.readiness_join);
  const readinessStatus = readinessManifest?.metrics?.readiness_status || 'blocked';
  const readinessBlockers = readinessManifest?.blockers || [];
  stepResults.push({
    step_id: 5,
    command_name: 'asr-readiness-join-gate',
    source_manifest: path.basename(manifestPaths.readiness_join),
    execution_mode: 'manifest_read',
    step_status: readinessStatus,
    blockers: readinessBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: readinessManifest?.next_action || 'Check readiness join output models and audios.'
  });
  if (readinessStatus !== 'dry_run_ready') {
    readinessBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 5 Blocker: ${b}`));
  }

  // Step 6: asr-manual-asset-revalidation-pass
  const revalManifest = tryReadJson(manifestPaths.revalidation);
  const revalStatus = revalManifest?.final_revalidation_status || 'blocked';
  const revalBlockers = revalManifest?.blockers || [];
  stepResults.push({
    step_id: 6,
    command_name: 'asr-manual-asset-revalidation-pass',
    source_manifest: path.basename(manifestPaths.revalidation),
    execution_mode: 'manifest_read',
    step_status: revalStatus,
    blockers: revalBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: revalManifest?.next_action || 'Consolidate revalidation checks outputs.'
  });
  if (revalStatus !== 'dry_run_ready') {
    revalBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 6 Blocker: ${b}`));
  }

  // Step 7: asr-gate-rerun-orchestrator
  const gateRerunManifest = tryReadJson(manifestPaths.gate_rerun);
  const gateRerunStatus = gateRerunManifest?.final_gate_rerun_status || 'blocked';
  const gateRerunBlockers = gateRerunManifest?.blockers || [];
  stepResults.push({
    step_id: 7,
    command_name: 'asr-gate-rerun-orchestrator',
    source_manifest: path.basename(manifestPaths.gate_rerun),
    execution_mode: 'manifest_read',
    step_status: gateRerunStatus,
    blockers: gateRerunBlockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: gateRerunManifest?.next_action || 'Verify gate rerun statuses from manifests.'
  });
  if (gateRerunStatus !== 'dry_run_ready') {
    gateRerunBlockers.forEach((b: string) => consolidatedBlockers.push(`Step 7 Blocker: ${b}`));
  }

  // Fail closed conditions check
  const failClosedCondition =
    !isTriggerReady ||
    !isModelPresent ||
    !isAudioStaged ||
    !isPhase12aLocked ||
    verifyStatus !== 'ready_for_gate_rerun' ||
    preflightStatus !== 'ready_for_revalidation' ||
    checksumStatus !== 'dry_run_ready' ||
    (audioStatus !== 'staged_ready' && audioStatus !== 'dry_run_ready') ||
    readinessStatus !== 'dry_run_ready' ||
    revalStatus !== 'dry_run_ready' ||
    gateRerunStatus !== 'dry_run_ready' ||
    asrCalled ||
    transcriptionGenerated ||
    externalApiCalled ||
    downloadCalled ||
    !fs.existsSync(manifestPaths.human_staged_verification) ||
    !fs.existsSync(manifestPaths.preflight) ||
    !fs.existsSync(manifestPaths.checksum_validation) ||
    !fs.existsSync(manifestPaths.audio_staging) ||
    !fs.existsSync(manifestPaths.readiness_join) ||
    !fs.existsSync(manifestPaths.revalidation) ||
    !fs.existsSync(manifestPaths.gate_rerun);

  let validationChainStatus: 'blocked' | 'dry_run_ready' = 'blocked';
  let eligibilityStatus = 'BLOCKED (preconditions or gate validation failures)';
  let summaryRollup = '';

  if (failClosedCondition) {
    validationChainStatus = 'blocked';
    eligibilityStatus = 'BLOCKED (ASR validation chain has unresolved blockers)';
    summaryRollup = 'Validation chain execution report completed: BLOCKED. One or more ASR validation gates have failed preconditions or missing staging assets. Safe lock rules have been verified and enforced.';
    
    // Add validation-specific blockers
    if (!isTriggerReady) consolidatedBlockers.push("Precondition Blocker: Rerun trigger status is not ready_to_rerun_validation_chain");
    if (!isModelPresent) consolidatedBlockers.push("Precondition Blocker: Required Whisper model binaries are not placed on disk");
    if (!isAudioStaged) consolidatedBlockers.push("Precondition Blocker: Audio staging status is empty (0 eligible audio files staged)");
    if (!isPhase12aLocked) consolidatedBlockers.push("Precondition Blocker: Phase 12A lock status is UNLOCKED (expected: LOCKED)");
    if (asrCalled) consolidatedBlockers.push("Safety Violation Blocker: ASR execution occurred or was configured to true");
    if (transcriptionGenerated) consolidatedBlockers.push("Safety Violation Blocker: Audio transcription was generated or was configured to true");
    if (externalApiCalled) consolidatedBlockers.push("Safety Violation Blocker: External API calls occurred or were configured to true");
    if (downloadCalled) consolidatedBlockers.push("Safety Violation Blocker: Whisper model downloads occurred or were configured to true");
  } else {
    validationChainStatus = 'dry_run_ready';
    eligibilityStatus = 'ELIGIBLE (all gates successfully validated, dry_run_ready)';
    summaryRollup = 'Validation chain execution report completed: DRY RUN READY. All ASR validation gates have passed preconditions and verification. Ready for Phase 12A human activation switch.';
  }

  // Compile individual templates
  // a) Preconditions md
  const preconditionMd = loadAndReplaceTemplate('asr-validation-chain-precondition-template.md', {
    RERUN_TRIGGER_STATUS: triggerStatus.toUpperCase(),
    OPERATOR_STATUS: operatorStatus.toUpperCase(),
    MODEL_STATUS: modelStagingStatus.toUpperCase(),
    AUDIO_STATUS: audioStagingStatus.toUpperCase(),
    PHASE_12A_STATUS: phase12aLockStatus.toUpperCase()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_preconditions_${dateStr}.md`), preconditionMd);

  // b) Step Results md
  let tableRowsStr = '';
  stepResults.forEach((s) => {
    const blockersText = s.blockers.length > 0 ? s.blockers.join(', ') : 'None';
    tableRowsStr += `| Step ${s.step_id} | ${s.command_name} | ${s.source_manifest} | ${s.execution_mode} | ${s.step_status.toUpperCase()} | ${blockersText} | ${s.asr_called} | ${s.transcription_generated} | ${s.external_api_called} | ${s.download_called} |\n`;
  });
  const stepResultsMd = loadAndReplaceTemplate('asr-validation-chain-step-result-template.md', {
    STEP_RESULTS_TABLE_ROWS: tableRowsStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_step_results_${dateStr}.md`), stepResultsMd);

  // c) Blockers md
  let blockersListStr = '';
  if (consolidatedBlockers.length > 0) {
    consolidatedBlockers.forEach((b, idx) => {
      blockersListStr += `- [ ] **Blocker ${idx + 1}:** ${b}\n`;
    });
  } else {
    blockersListStr += `* **No active blockers.** Validation chain has completed with dry_run_ready status.\n`;
  }
  const blockersMd = loadAndReplaceTemplate('asr-validation-chain-blocker-template.md', {
    BLOCKERS_LIST: blockersListStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_blockers_${dateStr}.md`), blockersMd);

  // d) Final Status md
  const finalStatusMd = loadAndReplaceTemplate('asr-validation-chain-final-status-template.md', {
    VALIDATION_CHAIN_STATUS: validationChainStatus.toUpperCase(),
    ELIGIBILITY_STATUS: eligibilityStatus
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_final_status_${dateStr}.md`), finalStatusMd);

  // e) Safety md
  const safetyMd = loadAndReplaceTemplate('asr-validation-chain-safety-template.md', {
    ASR_CALLED: String(asrCalled || ALLOW_ASR_EXECUTION),
    TRANSCRIPTION_GENERATED: String(transcriptionGenerated || ALLOW_AUDIO_TRANSCRIPTION),
    EXTERNAL_API_CALLED: String(externalApiCalled || ALLOW_EXTERNAL_API_CALLS),
    DOWNLOAD_CALLED: String(downloadCalled || ALLOW_MODEL_DOWNLOAD),
    MUTATIONS_CALLED: 'false'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_safety_${dateStr}.md`), safetyMd);

  // f) Summary md
  const summaryMd = loadAndReplaceTemplate('asr-validation-chain-summary-template.md', {
    SUMMARY_ROLLUP: summaryRollup
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_summary_${dateStr}.md`), summaryMd);

  // g) Next actions md
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: validationChainStatus === 'dry_run_ready' 
      ? 'Phase 12A: Offline ASR Execution Approval Switch (Create human switch approval for offline ASR transcription)'
      : 'Resolve missing staged Whisper binaries and audio assets manually, rerun audit scripts, and recreate trigger packet.'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // h) Consolidated Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-validation-chain-report-template.md', {
    DATE: dateStr,
    VALIDATION_CHAIN_STATUS: validationChainStatus.toUpperCase(),
    PRECONDITIONS_SECTION: preconditionMd.trim(),
    STEP_RESULTS_SECTION: stepResultsMd.trim(),
    BLOCKERS_SECTION: blockersMd.trim(),
    SUMMARY_SECTION: finalStatusMd.trim() + '\n\n' + summaryMd.trim(),
    SAFETY_SECTION: safetyMd.trim(),
    NEXT_PHASE_RECOMMENDATION: validationChainStatus === 'dry_run_ready' 
      ? 'Phase 12A: Offline ASR Execution Approval Switch' 
      : 'Resolve staging gaps first.'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_chain_report_${dateStr}.md`), masterReportMd);

  // i) Consolidated JSON Manifest
  const jsonManifest = {
    validation_chain_id: `asr_validation_chain_${dateStr}`,
    manifest_version: "1.0",
    generated_date: dateStr,
    validation_chain_status: validationChainStatus,
    preconditions_status: {
      rerun_trigger_status: triggerStatus,
      model_staging_status: modelStagingStatus,
      audio_staging_status: audioStagingStatus,
      phase_12a_lock_status: phase12aLockStatus
    },
    step_results: stepResults,
    safety_locks: {
      asr_called: asrCalled || ALLOW_ASR_EXECUTION,
      transcription_generated: transcriptionGenerated || ALLOW_AUDIO_TRANSCRIPTION,
      external_api_called: externalApiCalled || ALLOW_EXTERNAL_API_CALLS,
      download_called: downloadCalled || ALLOW_MODEL_DOWNLOAD
    },
    blockers: consolidatedBlockers,
    next_phase_recommendation: validationChainStatus === 'dry_run_ready'
      ? "Phase 12A: Offline ASR Execution Approval Switch"
      : "Resolve missing staged Whisper binaries and audio assets manually, rerun audit scripts, and recreate trigger packet."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_validation_chain_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=================================================");
  console.log("🟢 ASR VALIDATION CHAIN EXECUTION REPORT COMPLETE");
  console.log("=================================================");
  console.log(`Summary Document: outputs/asr_validation_chain/asr_validation_chain_report_${dateStr}.md`);
  console.log(`JSON Manifest:    outputs/asr_validation_chain/asr_validation_chain_manifest_${dateStr}.json`);
  console.log(`Final Status:     ${validationChainStatus.toUpperCase()}`);
  console.log("=================================================");

  if (failClosedCondition) {
    console.error("❌ Failed closed: Preconditions not met or active gate blockers exist. Dry run readiness is BLOCKED.");
    await announceCompletion("ASR validation chain execution report failed (preconditions or gate blockers).", "0");
    process.exit(1);
  } else {
    await announceCompletion("ASR validation chain execution report completed successfully.", "12");
  }
}

runValidationChainReport().catch((err) => {
  console.error(`❌ Validation Chain execution error: ${(err as Error).message}`);
  process.exit(1);
});
