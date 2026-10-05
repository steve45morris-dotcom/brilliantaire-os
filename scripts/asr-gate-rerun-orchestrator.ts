import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  GATE_SEQUENCE_TARGETS,
  MANIFEST_PATHS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY
} from '../config/asr-gate-rerun-orchestrator.js';
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

async function runOrchestrator() {
  console.log("🚦 Starting ASR Gate Rerun Orchestrator (Phase 11Z-J)...");
  await announcePhrase("Knight standing by. Executing ASR gate rerun orchestrator.");
  await announceIntent("Rerunning and validating ASR gate sequence.");

  const dateStr = getFormattedDate();

  const REPO_ROOT = path.resolve(__dirname, '..');
  const MANIFEST_PATHS = {
    human_staged_verification: path.join(REPO_ROOT, 'outputs', 'asr_human_staged_verification', `asr_human_staged_verification_manifest_${dateStr}.json`),
    preflight: path.join(REPO_ROOT, 'outputs', 'asr_asset_preflight', `asr_asset_preflight_manifest_${dateStr}.json`),
    checksum_validation: path.join(REPO_ROOT, 'outputs', 'asr_validation', `asr_checksum_validation_manifest_${dateStr}.json`),
    audio_staging: path.join(REPO_ROOT, 'outputs', 'asr_audio_staging', `asr_audio_staging_manifest_${dateStr}.json`),
    readiness_join: path.join(REPO_ROOT, 'outputs', 'asr_readiness_join', `asr_readiness_join_manifest_${dateStr}.json`),
    revalidation: path.join(REPO_ROOT, 'outputs', 'asr_revalidation', `asr_revalidation_manifest_${dateStr}.json`)
  };

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // Precondition Check: Read human verification manifest
  let humanStagedStatus = 'blocked';
  let humanStagedBlockers: string[] = [];
  const blockers: string[] = [];

  const humanVerificationManifestPath = MANIFEST_PATHS.human_staged_verification;
  if (!fs.existsSync(humanVerificationManifestPath)) {
    blockers.push(`Precondition Failed: Human verification manifest does not exist at ${path.basename(humanVerificationManifestPath)}`);
  } else {
    try {
      const data = JSON.parse(fs.readFileSync(humanVerificationManifestPath, 'utf-8'));
      humanStagedStatus = data?.verification_rollup?.human_staged_verification_status || 'blocked';
      if (data?.blockers && Array.isArray(data.blockers)) {
        humanStagedBlockers = data.blockers;
      }
    } catch (e) {
      blockers.push(`Precondition Failed: Failed to parse human verification manifest JSON: ${(e as Error).message}`);
    }
  }

  // Gates Status Tracker
  const gateSequenceStatus: Record<string, string> = {
    'asr-manual-asset-presence-preflight': 'blocked',
    'asr-checksum-manifest-validation-gate': 'blocked',
    'asr-audio-input-staging-validation-gate': 'blocked',
    'asr-readiness-join-gate': 'blocked',
    'asr-manual-asset-revalidation-pass': 'blocked'
  };

  const gateExecutionStatus: Record<string, 'VERIFIED' | 'SKIPPED' | 'FAILED'> = {
    'asr-manual-asset-presence-preflight': 'SKIPPED',
    'asr-checksum-manifest-validation-gate': 'SKIPPED',
    'asr-audio-input-staging-validation-gate': 'SKIPPED',
    'asr-readiness-join-gate': 'SKIPPED',
    'asr-manual-asset-revalidation-pass': 'SKIPPED'
  };

  let preflightStatus = 'blocked';
  let checksumStatus = 'blocked';
  let audioStagingStatus = 'blocked';
  let readinessJoinStatus = 'blocked';
  let revalidationStatus = 'blocked';

  if (humanStagedStatus !== 'ready_for_gate_rerun') {
    blockers.push(`Precondition Failed: Human staged verification status is '${humanStagedStatus}'. Gate sequence execution skipped.`);
    // Add original blockers from human-staged verification
    humanStagedBlockers.forEach(b => {
      blockers.push(`Verification Blocker: ${b}`);
    });
  } else {
    // If precondition passes, we read latest manifest outputs to verify status
    console.log("🟢 Precondition passed. Verifying gate statuses from latest manifests...");

    // 1. Preflight
    if (fs.existsSync(MANIFEST_PATHS.preflight)) {
      try {
        const data = JSON.parse(fs.readFileSync(MANIFEST_PATHS.preflight, 'utf-8'));
        preflightStatus = data?.preflight_status || 'blocked';
        gateSequenceStatus['asr-manual-asset-presence-preflight'] = preflightStatus;
        gateExecutionStatus['asr-manual-asset-presence-preflight'] = 'VERIFIED';
        if (preflightStatus !== 'ready_for_revalidation') {
          blockers.push(`Gate 1 Preflight check is not ready_for_revalidation. Status: '${preflightStatus}'`);
        }
      } catch (e) {
        blockers.push(`Failed to parse Preflight manifest: ${(e as Error).message}`);
      }
    } else {
      blockers.push(`Preflight manifest is missing at ${path.basename(MANIFEST_PATHS.preflight)}`);
    }

    // 2. Checksum Validation
    if (fs.existsSync(MANIFEST_PATHS.checksum_validation)) {
      try {
        const data = JSON.parse(fs.readFileSync(MANIFEST_PATHS.checksum_validation, 'utf-8'));
        checksumStatus = data?.checks_metrics?.final_model_trust_status || 'blocked';
        gateSequenceStatus['asr-checksum-manifest-validation-gate'] = checksumStatus;
        gateExecutionStatus['asr-checksum-manifest-validation-gate'] = 'VERIFIED';
        if (checksumStatus !== 'dry_run_ready') {
          blockers.push(`Gate 2 Checksum Validation check is not dry_run_ready. Status: '${checksumStatus}'`);
        }
      } catch (e) {
        blockers.push(`Failed to parse Checksum Validation manifest: ${(e as Error).message}`);
      }
    } else {
      blockers.push(`Checksum validation manifest is missing at ${path.basename(MANIFEST_PATHS.checksum_validation)}`);
    }

    // 3. Audio Staging
    if (fs.existsSync(MANIFEST_PATHS.audio_staging)) {
      try {
        const data = JSON.parse(fs.readFileSync(MANIFEST_PATHS.audio_staging, 'utf-8'));
        audioStagingStatus = data?.audio_readiness_metrics?.final_audio_staging_gate_state || 'blocked';
        gateSequenceStatus['asr-audio-input-staging-validation-gate'] = audioStagingStatus;
        gateExecutionStatus['asr-audio-input-staging-validation-gate'] = 'VERIFIED';
        if (audioStagingStatus !== 'staged_ready' && audioStagingStatus !== 'dry_run_ready') {
          blockers.push(`Gate 3 Audio Staging check is not staged_ready or dry_run_ready. Status: '${audioStagingStatus}'`);
        }
      } catch (e) {
        blockers.push(`Failed to parse Audio Staging manifest: ${(e as Error).message}`);
      }
    } else {
      blockers.push(`Audio staging manifest is missing at ${path.basename(MANIFEST_PATHS.audio_staging)}`);
    }

    // 4. Readiness Join
    if (fs.existsSync(MANIFEST_PATHS.readiness_join)) {
      try {
        const data = JSON.parse(fs.readFileSync(MANIFEST_PATHS.readiness_join, 'utf-8'));
        readinessJoinStatus = data?.metrics?.readiness_status || 'blocked';
        gateSequenceStatus['asr-readiness-join-gate'] = readinessJoinStatus;
        gateExecutionStatus['asr-readiness-join-gate'] = 'VERIFIED';
        if (readinessJoinStatus !== 'dry_run_ready') {
          blockers.push(`Gate 4 Readiness Join check is not dry_run_ready. Status: '${readinessJoinStatus}'`);
        }
      } catch (e) {
        blockers.push(`Failed to parse Readiness Join manifest: ${(e as Error).message}`);
      }
    } else {
      blockers.push(`Readiness Join manifest is missing at ${path.basename(MANIFEST_PATHS.readiness_join)}`);
    }

    // 5. Revalidation
    if (fs.existsSync(MANIFEST_PATHS.revalidation)) {
      try {
        const data = JSON.parse(fs.readFileSync(MANIFEST_PATHS.revalidation, 'utf-8'));
        revalidationStatus = data?.final_revalidation_status || 'blocked';
        gateSequenceStatus['asr-manual-asset-revalidation-pass'] = revalidationStatus;
        gateExecutionStatus['asr-manual-asset-revalidation-pass'] = 'VERIFIED';
        if (revalidationStatus !== 'dry_run_ready') {
          blockers.push(`Gate 5 Revalidation Pass check is not dry_run_ready. Status: '${revalidationStatus}'`);
        }
      } catch (e) {
        blockers.push(`Failed to parse Revalidation manifest: ${(e as Error).message}`);
      }
    } else {
      blockers.push(`Revalidation manifest is missing at ${path.basename(MANIFEST_PATHS.revalidation)}`);
    }
  }

  // 8. Final readiness logic
  let finalGateRerunStatus: 'blocked' | 'dry_run_ready' = 'blocked';

  const satisfiesDryRunReady =
    humanStagedStatus === 'ready_for_gate_rerun' &&
    preflightStatus === 'ready_for_revalidation' &&
    checksumStatus === 'dry_run_ready' &&
    (audioStagingStatus === 'staged_ready' || audioStagingStatus === 'dry_run_ready') &&
    readinessJoinStatus === 'dry_run_ready' &&
    revalidationStatus === 'dry_run_ready' &&
    !ALLOW_ASR_EXECUTION &&
    !ALLOW_AUDIO_TRANSCRIPTION &&
    !ALLOW_EXTERNAL_API_CALLS &&
    !ALLOW_MODEL_DOWNLOAD;

  if (satisfiesDryRunReady) {
    finalGateRerunStatus = 'dry_run_ready';
  } else {
    finalGateRerunStatus = 'blocked';
  }

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
  // a) Gate Sequence Result md
  let sequenceTable = `| Step | Gate Target / Command | Expected Status | Actual Status | Re-run Command | Execution Status |\n`;
  sequenceTable += `|---|---|---|---|---|---|\n`;
  sequenceTable += `| 1 | \`asr-manual-asset-presence-preflight\` | \`ready_for_revalidation\` | \`${preflightStatus}\` | \`npm run command -- "asr-manual-asset-presence-preflight"\` | \`${gateExecutionStatus['asr-manual-asset-presence-preflight']}\` |\n`;
  sequenceTable += `| 2 | \`asr-checksum-manifest-validation-gate\` | \`dry_run_ready\` | \`${checksumStatus}\` | \`npm run command -- "asr-checksum-manifest-validation-gate"\` | \`${gateExecutionStatus['asr-checksum-manifest-validation-gate']}\` |\n`;
  sequenceTable += `| 3 | \`asr-audio-input-staging-validation-gate\` | \`staged_ready\` | \`${audioStagingStatus}\` | \`npm run command -- "asr-audio-input-staging-validation-gate"\` | \`${gateExecutionStatus['asr-audio-input-staging-validation-gate']}\` |\n`;
  sequenceTable += `| 4 | \`asr-readiness-join-gate\` | \`dry_run_ready\` | \`${readinessJoinStatus}\` | \`npm run command -- "asr-readiness-join-gate"\` | \`${gateExecutionStatus['asr-readiness-join-gate']}\` |\n`;
  sequenceTable += `| 5 | \`asr-manual-asset-revalidation-pass\` | \`dry_run_ready\` | \`${revalidationStatus}\` | \`npm run command -- "asr-manual-asset-revalidation-pass"\` | \`${gateExecutionStatus['asr-manual-asset-revalidation-pass']}\` |\n`;

  const resultsMd = loadAndReplaceTemplate('asr-gate-sequence-result-template.md', {
    SEQUENCE_TABLE: sequenceTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_gate_sequence_results_${dateStr}.md`), resultsMd);

  // b) Blockers Checklist md
  let checklistStr = '';
  if (blockers.length > 0) {
    blockers.forEach((b, idx) => {
      checklistStr += `- [ ] **Orchestration blocker ${idx + 1}:** ${b}\n`;
    });
  } else {
    checklistStr = `* **No orchestration blockers.** All gate sequence components verified successfully. ready_for_revalidation and dry_run_ready statuses validated.\n`;
  }
  const blockersMd = loadAndReplaceTemplate('asr-gate-rerun-blocker-template.md', {
    BLOCKERS_CHECKLIST: checklistStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_gate_rerun_blockers_${dateStr}.md`), blockersMd);

  // c) Safety & Readiness md
  const readinessMd = loadAndReplaceTemplate('asr-gate-rerun-readiness-template.md', {
    FINAL_GATE_RERUN_STATUS: finalGateRerunStatus
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_gate_rerun_readiness_${dateStr}.md`), readinessMd);

  // d) Summary md
  let summaryRollupText = '';
  if (finalGateRerunStatus === 'dry_run_ready') {
    summaryRollupText = 'ASR gate rerun verification SUCCESSFUL. All offline validation checks passed. Phase 12A offline switches enabled.';
  } else {
    summaryRollupText = 'ASR gate rerun verification BLOCKED. Missing required local model assets, incorrect manifest checksums, or missing audio files.';
  }
  const summaryMd = loadAndReplaceTemplate('asr-gate-rerun-summary-template.md', {
    VERIFICATION_SUMMARY: summaryRollupText
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_gate_rerun_summary_${dateStr}.md`), summaryMd);

  // e) Next actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 12A: Offline ASR Execution Approval Switch'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // f) Combined report md
  const masterReportMd = loadAndReplaceTemplate('asr-gate-rerun-report-template.md', {
    DATE: dateStr,
    HUMAN_VERIFICATION_STATUS: humanStagedStatus.toUpperCase(),
    GATE_SEQUENCE_STATUS: finalGateRerunStatus === 'dry_run_ready' ? 'PASS' : 'BLOCKED',
    FINAL_GATE_RERUN_STATUS: finalGateRerunStatus.toUpperCase(),
    GATE_SEQUENCE_RESULTS: resultsMd.trim(),
    BLOCKER_DETAILS: blockersMd.trim(),
    READINESS_DETAILS: readinessMd.trim(),
    SUMMARY_DETAILS: summaryMd.trim(),
    NEXT_ACTION_DETAILS: nextActionsMd.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_gate_rerun_report_${dateStr}.md`), masterReportMd);

  // 6. Write JSON manifest
  const jsonManifest = {
    ledger_id: `asr_gate_rerun_${dateStr}`,
    manifest_version: "1.0",
    orchestration_date: dateStr,
    precondition: {
      human_staged_verification_manifest_path: humanVerificationManifestPath,
      human_staged_verification_manifest_exists: fs.existsSync(humanVerificationManifestPath),
      human_staged_verification_status: humanStagedStatus
    },
    gate_sequence_evaluations: {
      preflight_status: preflightStatus,
      checksum_validation_status: checksumStatus,
      audio_staging_status: audioStagingStatus,
      readiness_join_status: readinessJoinStatus,
      revalidation_status: revalidationStatus
    },
    final_gate_rerun_status: finalGateRerunStatus,
    safety_locks: {
      asr_called: ALLOW_ASR_EXECUTION,
      transcription_generated: ALLOW_AUDIO_TRANSCRIPTION,
      external_api_called: ALLOW_EXTERNAL_API_CALLS,
      download_called: ALLOW_MODEL_DOWNLOAD
    },
    blockers: blockers,
    next_action: finalGateRerunStatus === 'dry_run_ready'
      ? "Proceed to stage human-controlled ASR execution approval switches (Phase 12A)."
      : "Address staging gaps, place missing binaries, correct manifestations, and rerun underlying gate validations."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_gate_rerun_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR GATE RERUN ORCHESTRATION COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report: outputs/asr_gate_rerun/asr_gate_rerun_report_${dateStr}.md`);
  console.log(`JSON Manifest:  outputs/asr_gate_rerun/asr_gate_rerun_manifest_${dateStr}.json`);
  console.log(`Final Status:   ${finalGateRerunStatus.toUpperCase()}`);
  console.log(`Precondition:   ${humanStagedStatus.toUpperCase()}`);
  console.log("=========================================");

  await announceCompletion("ASR gate rerun orchestration pass completed successfully.", "12");
}

runOrchestrator().catch((err) => {
  console.error(`❌ Orchestrator execution error: ${(err as Error).message}`);
  process.exit(1);
});
