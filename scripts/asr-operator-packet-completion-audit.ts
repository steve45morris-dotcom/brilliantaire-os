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
} from '../config/asr-operator-packet-completion-audit.js';
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

async function runAudit() {
  console.log("🚦 Starting ASR Operator Packet Completion Audit (Phase 11Z-L)...");
  await announcePhrase("Knight standing by. Executing operator packet completion audit.");
  await announceIntent("Auditing manual asset staging completion state.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  const blockers: string[] = [];

  // ==========================================
  // 1. Model Placement Audit
  // ==========================================
  const modelAudits: any[] = [];
  let allModelsPresent = true;
  let allModelsReadable = true;

  for (const filename of EXPECTED_MODELS) {
    const fullPath = path.join(EXPECTED_MODEL_DIRECTORY, filename);
    const exists = fs.existsSync(fullPath);
    let readable = false;
    let sizeBytes: number | null = null;
    let placementStatus: 'present' | 'missing' = 'missing';
    let nextAction = '';

    if (exists) {
      placementStatus = 'present';
      try {
        fs.accessSync(fullPath, fs.constants.R_OK);
        readable = true;
        sizeBytes = fs.statSync(fullPath).size;
        nextAction = 'Model successfully placed and readable.';
      } catch (e) {
        allModelsReadable = false;
        blockers.push(`Staged model file ${filename} is unreadable.`);
        nextAction = 'Grant read permissions to model binary.';
      }
    } else {
      allModelsPresent = false;
      blockers.push(`Required model binary ${filename} is missing from models/asr/whisper/`);
      nextAction = 'Place binary ggml model manually.';
    }

    modelAudits.push({
      model_filename: filename,
      expected_path: path.relative(REPO_ROOT, fullPath),
      exists,
      readable,
      size_bytes: sizeBytes,
      placement_status: placementStatus,
      next_action: nextAction
    });
  }

  // ==========================================
  // 2. Manifest Completion Audit
  // ==========================================
  const manifestAudits: any[] = [];
  let manifestsComplete = true;

  for (const manifestPath of CHECKSUM_MANIFEST_FILES) {
    const relManifestPath = path.relative(REPO_ROOT, manifestPath);
    const manifestExists = fs.existsSync(manifestPath);

    if (!manifestExists) {
      manifestsComplete = false;
      blockers.push(`Required manifest file is missing at ${relManifestPath}`);
      continue;
    }

    let manifestData: any = null;
    try {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) {
      manifestsComplete = false;
      blockers.push(`Manifest at ${relManifestPath} is not readable or invalid JSON.`);
      continue;
    }

    for (const filename of EXPECTED_MODELS) {
      const entry = manifestData[filename];
      const entryExists = !!entry;
      let sha256Present = false;
      let sha256FormatValid = false;
      let sizePresent = false;
      let sizePositive = false;
      let methodManualOnly = false;
      let downloadBlocked = false;
      let executionBlocked = false;
      let apiBlocked = false;
      let trustStatusPresent = false;
      let completionStatus: 'complete' | 'incomplete' = 'incomplete';
      let nextAction = '';

      if (entryExists) {
        sha256Present = !!entry.expected_sha256;
        sha256FormatValid = sha256Present && /^[a-fA-F0-9]{64}$/.test(entry.expected_sha256);
        sizePresent = entry.file_size_bytes !== undefined;
        sizePositive = sizePresent && entry.file_size_bytes > 0;
        methodManualOnly = entry.acquisition_method === 'manual_only';
        downloadBlocked = entry.download_allowed === false;
        executionBlocked = entry.asr_execution_allowed === false;
        apiBlocked = entry.external_api_allowed === false;
        trustStatusPresent = entry.trust_status === 'pending_manual_verification';

        const entryComplete =
          sha256FormatValid &&
          sizePositive &&
          methodManualOnly &&
          downloadBlocked &&
          executionBlocked &&
          apiBlocked &&
          trustStatusPresent;

        if (entryComplete) {
          completionStatus = 'complete';
          nextAction = 'Entry configuration complete.';
        } else {
          manifestsComplete = false;
          completionStatus = 'incomplete';
          const subGaps: string[] = [];
          if (!sha256FormatValid) subGaps.push('expected_sha256 must be a valid 64-character hex hash');
          if (!sizePositive) subGaps.push('file_size_bytes must be a positive integer');
          if (!methodManualOnly) subGaps.push("acquisition_method must be 'manual_only'");
          if (!downloadBlocked) subGaps.push('download_allowed must be false');
          if (!executionBlocked) subGaps.push('asr_execution_allowed must be false');
          if (!apiBlocked) subGaps.push('external_api_allowed must be false');
          if (!trustStatusPresent) subGaps.push("trust_status must be 'pending_manual_verification'");

          blockers.push(`Manifest entry for ${filename} at ${path.basename(manifestPath)} is incomplete: ${subGaps.join(', ')}`);
          nextAction = `Correct entry fields: ${subGaps.join('; ')}`;
        }
      } else {
        manifestsComplete = false;
        blockers.push(`Manifest entry for ${filename} is missing in ${path.basename(manifestPath)}`);
        nextAction = `Create entry definition for ${filename} with mandatory validation fields.`;
      }

      manifestAudits.push({
        model_filename: filename,
        manifest_path: relManifestPath,
        entry_exists: entryExists,
        expected_sha256_present: sha256Present,
        expected_sha256_format_valid: sha256FormatValid,
        file_size_bytes_present: sizePresent,
        file_size_bytes_positive: sizePositive,
        acquisition_method_is_manual_only: methodManualOnly,
        download_allowed_is_false: downloadBlocked,
        asr_execution_allowed_is_false: executionBlocked,
        external_api_allowed_is_false: apiBlocked,
        trust_status_present: trustStatusPresent,
        manifest_completion_status: completionStatus,
        next_action: nextAction
      });
    }
  }

  // ==========================================
  // 3. Audio Staging Audit
  // ==========================================
  const folderAudits: any[] = [];
  const discoveredAudioFiles: any[] = [];
  let totalDiscoveredAudios = 0;
  let totalEligibleAudios = 0;
  let audioIdCounter = 1;

  for (const dir of APPROVED_AUDIO_INPUT_DIRECTORIES) {
    const relFolder = path.relative(REPO_ROOT, dir);
    const folderExists = fs.existsSync(dir);
    let readable = false;
    let acceptedCount = 0;
    let unsupportedCount = 0;
    let zeroByteCount = 0;
    let status: 'active' | 'empty' | 'missing' = 'empty';
    let nextAction = '';

    if (folderExists) {
      status = 'empty';
      try {
        fs.accessSync(dir, fs.constants.R_OK);
        readable = true;
        
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') return;
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) return;

          totalDiscoveredAudios++;

          const ext = path.extname(file).toLowerCase();
          const isAcceptedExt = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
          const isSafeName = /^[a-zA-Z0-9_\-\.]+$/.test(file);
          const isNonZero = stat.size > 0;
          let fileReadable = false;
          try {
            fs.accessSync(fullPath, fs.constants.R_OK);
            fileReadable = true;
          } catch (_) {}

          const eligible = isAcceptedExt && isSafeName && isNonZero && fileReadable;

          if (!isAcceptedExt) unsupportedCount++;
          if (isAcceptedExt && !isNonZero) zeroByteCount++;

          let revalidationStatus: 'eligible' | 'rejected' = 'rejected';
          let rejectionReason: string | null = null;

          if (eligible) {
            acceptedCount++;
            totalEligibleAudios++;
            revalidationStatus = 'eligible';
          } else {
            revalidationStatus = 'rejected';
            if (!isAcceptedExt) rejectionReason = 'Unsupported audio extension.';
            else if (!isNonZero) rejectionReason = 'Zero-byte file size.';
            else if (!isSafeName) rejectionReason = 'Filename contains unsafe characters.';
            else if (!fileReadable) rejectionReason = 'File is unreadable.';
          }

          discoveredAudioFiles.push({
            audio_id: `audio_${String(audioIdCounter++).padStart(3, '0')}`,
            filename: file,
            local_path: path.relative(REPO_ROOT, fullPath),
            extension: ext,
            size_bytes: stat.size,
            accepted_extension: isAcceptedExt,
            safe_filename: isSafeName,
            readable: fileReadable,
            staging_candidate_status: revalidationStatus,
            transcription_allowed: false
          });
        });

        if (acceptedCount > 0) {
          status = 'active';
        }
        nextAction = acceptedCount > 0 ? 'Folder contains staged audios.' : 'Place audio files manually (.wav, .mp3, etc.).';
      } catch (e) {
        blockers.push(`Staging folder ${relFolder} is not readable.`);
        nextAction = 'Grant read permissions to folder.';
      }
    } else {
      status = 'missing';
      blockers.push(`Staging folder ${relFolder} is missing.`);
      nextAction = 'Create folder locally.';
    }

    folderAudits.push({
      folder_path: relFolder,
      exists: folderExists,
      readable,
      accepted_audio_file_count: acceptedCount,
      unsupported_file_count: unsupportedCount,
      zero_byte_file_count: zeroByteCount,
      audio_staging_status: status,
      next_action: nextAction
    });
  }

  if (totalEligibleAudios === 0) {
    blockers.push('No eligible staged audio files discovered across recordings/, inputAudio/, or outputs/asr_inputs/');
  }

  // ==========================================
  // 4. Completion Status Logic
  // ==========================================
  let completionStatus: 'blocked' | 'ready_for_verification_rerun' = 'blocked';

  const satisfiesRerun =
    allModelsPresent &&
    allModelsReadable &&
    manifestsComplete &&
    totalEligibleAudios > 0 &&
    !ALLOW_ASR_EXECUTION &&
    !ALLOW_AUDIO_TRANSCRIPTION &&
    !ALLOW_EXTERNAL_API_CALLS &&
    !ALLOW_MODEL_DOWNLOAD;

  if (satisfiesRerun) {
    completionStatus = 'ready_for_verification_rerun';
  } else {
    completionStatus = 'blocked';
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
  // a) Model Placement audit md
  let modelAuditTable = `| Model Filename | Expected Destination Path | Exists | Readable | Size (Bytes) | Placement Status | Next Action |\n`;
  modelAuditTable += `|---|---|---|---|---|---|---|\n`;
  modelAudits.forEach(m => {
    modelAuditTable += `| \`${m.model_filename}\` | \`${m.expected_path}\` | \`${m.exists}\` | \`${m.readable}\` | ${m.size_bytes !== null ? m.size_bytes : '-'} | \`${m.placement_status}\` | ${m.next_action} |\n`;
  });
  const modelPlacementMd = loadAndReplaceTemplate('asr-operator-model-placement-audit-template.md', {
    MODEL_AUDIT_TABLE: modelAuditTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_model_placement_audit_${dateStr}.md`), modelPlacementMd);

  // b) Manifest completion audit md
  let manifestAuditTable = `| Model Filename | Manifest File Path | Entry Exists | Hash Present | Hash Valid | Size Present | Size > 0 | Method Manual | Lock Safety | Status | Next Action |\n`;
  manifestAuditTable += `|---|---|---|---|---|---|---|---|---|---|---|\n`;
  manifestAudits.forEach(m => {
    const lockSafety = m.download_allowed_is_false && m.asr_execution_allowed_is_false && m.external_api_allowed_is_false;
    manifestAuditTable += `| \`${m.model_filename}\` | \`${m.manifest_path}\` | \`${m.entry_exists}\` | \`${m.expected_sha256_present}\` | \`${m.expected_sha256_format_valid}\` | \`${m.file_size_bytes_present}\` | \`${m.file_size_bytes_positive}\` | \`${m.acquisition_method_is_manual_only}\` | \`${lockSafety}\` | \`${m.manifest_completion_status}\` | ${m.next_action} |\n`;
  });
  const manifestCompletionMd = loadAndReplaceTemplate('asr-operator-manifest-completion-audit-template.md', {
    MANIFEST_AUDIT_TABLE: manifestAuditTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_manifest_completion_audit_${dateStr}.md`), manifestCompletionMd);

  // c) Audio staging audit md
  let foldersTable = `| Folder Path | Exists | Readable | Eligible Files | Unsupported Files | Zero-Byte Files | Staging Status | Next Action |\n`;
  foldersTable += `|---|---|---|---|---|---|---|---|\n`;
  folderAudits.forEach(f => {
    foldersTable += `| \`${f.folder_path}\` | \`${f.exists}\` | \`${f.readable}\` | ${f.accepted_audio_file_count} | ${f.unsupported_file_count} | ${f.zero_byte_file_count} | \`${f.audio_staging_status}\` | ${f.next_action} |\n`;
  });

  let filesTable = `| Audio ID | Filename | Path Location | Extension | Size (Bytes) | Valid Ext | Safe Name | Readable | Candidate Status | ASR Allowed |\n`;
  filesTable += `|---|---|---|---|---|---|---|---|---|---|\n`;
  if (discoveredAudioFiles.length > 0) {
    discoveredAudioFiles.forEach(f => {
      filesTable += `| \`${f.audio_id}\` | \`${f.filename}\` | \`${f.local_path}\` | \`${f.extension}\` | ${f.size_bytes} | \`${f.accepted_extension}\` | \`${f.safe_filename}\` | \`${f.readable}\` | \`${f.staging_candidate_status}\` | \`${f.transcription_allowed}\` |\n`;
    });
  } else {
    filesTable += `| - | No audio files staged. | - | - | - | - | - | - | - | - |\n`;
  }
  const audioStagingMd = loadAndReplaceTemplate('asr-operator-audio-staging-audit-template.md', {
    FOLDERS_AUDIT_TABLE: foldersTable.trim(),
    FILES_AUDIT_TABLE: filesTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_audio_staging_audit_${dateStr}.md`), audioStagingMd);

  // d) Rerun sequence md
  let rerunSequenceStr = '';
  if (completionStatus === 'ready_for_verification_rerun') {
    rerunSequenceStr += `#### Required Verification Gates Rerun Order\n`;
    rerunSequenceStr += `Execute these commands sequentially to unblock ASR:\n\n`;
    rerunSequenceStr += `1. \`npm run command -- "asr-human-staged-asset-verification-pass"\`\n`;
    rerunSequenceStr += `2. \`npm run command -- "asr-manual-asset-presence-preflight"\`\n`;
    rerunSequenceStr += `3. \`npm run command -- "asr-checksum-manifest-validation-gate"\`\n`;
    rerunSequenceStr += `4. \`npm run command -- "asr-audio-input-staging-validation-gate"\`\n`;
    rerunSequenceStr += `5. \`npm run command -- "asr-readiness-join-gate"\`\n`;
    rerunSequenceStr += `6. \`npm run command -- "asr-manual-asset-revalidation-pass"\`\n`;
    rerunSequenceStr += `7. \`npm run command -- "asr-gate-rerun-orchestrator"\`\n`;
  } else {
    rerunSequenceStr += `> [!IMPORTANT]\n`;
    rerunSequenceStr += `> The ASR pipeline remains blocked. You must resolve all active blockers below before the gate sequence rerun is allowed.\n`;
  }
  const rerunReadinessMd = loadAndReplaceTemplate('asr-operator-rerun-readiness-template.md', {
    COMPLETION_STATUS: completionStatus.toUpperCase(),
    RERUN_SEQUENCE_BLOCK: rerunSequenceStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_rerun_readiness_${dateStr}.md`), rerunReadinessMd);

  // e) Blockers Checklist md
  let checklistStr = '';
  if (blockers.length > 0) {
    blockers.forEach((b, idx) => {
      checklistStr += `- [ ] **Blocker ${idx + 1}:** ${b}\n`;
    });
  } else {
    checklistStr = `* **No blockers.** All staging completion audit conditions verified successfully. Pipeline ready to execute verification gates rerun.\n`;
  }
  const blockersMd = loadAndReplaceTemplate('asr-operator-blockers-template.md', {
    BLOCKERS_CHECKLIST: checklistStr.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_blockers_${dateStr}.md`), blockersMd);

  // f) Summary md
  let auditSummaryText = '';
  if (completionStatus === 'ready_for_verification_rerun') {
    auditSummaryText = 'Operator staging complete. Whisper model files are present, manifests configured, and audio inputs are staged. READY to trigger full gates revalidation.';
  } else {
    auditSummaryText = 'Operator staging INCOMPLETE. Active gaps detected in model placement, checksum manifests, or audio staging. Rerun sequence BLOCKED.';
  }
  const summaryMd = loadAndReplaceTemplate('asr-operator-summary-template.md', {
    AUDIT_SUMMARY: auditSummaryText
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_summary_${dateStr}.md`), summaryMd);

  // g) Next actions (Next Phase: Phase 11Z-M: Verification Rerun Trigger Packet)
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-M: Verification Rerun Trigger Packet'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // h) Consolidated Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-operator-completion-audit-template.md', {
    DATE: dateStr,
    COMPLETION_STATUS: completionStatus.toUpperCase(),
    MODEL_PLACEMENT_AUDIT: modelPlacementMd.trim(),
    MANIFEST_COMPLETION_AUDIT: manifestCompletionMd.trim(),
    AUDIO_STAGING_AUDIT: audioStagingMd.trim(),
    BLOCKERS_CHECKLIST: blockersMd.trim(),
    RERUN_READINESS_GUIDE: rerunReadinessMd.trim(),
    SUMMARY_DETAILS: summaryMd.trim(),
    NEXT_ACTION_DETAILS: nextActionsMd.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_operator_completion_audit_${dateStr}.md`), masterReportMd);

  // 5. Generate JSON Manifest Audit Output
  const jsonManifest = {
    ledger_id: `asr_operator_completion_audit_${dateStr}`,
    manifest_version: "1.0",
    audit_date: dateStr,
    audit_rollup: {
      required_models_present: allModelsPresent,
      required_models_readable: allModelsReadable,
      manifests_complete: manifestsComplete,
      audio_folders_count: APPROVED_AUDIO_INPUT_DIRECTORIES.length,
      audio_files_discovered: totalDiscoveredAudios,
      eligible_audio_files: totalEligibleAudios,
      operator_packet_completion_status: completionStatus
    },
    model_placement_audit: modelAudits,
    manifest_completion_audit: manifestAudits,
    audio_staging_audit: {
      folder_metrics: folderAudits,
      discovered_files: discoveredAudioFiles
    },
    safety_locks: {
      phase_12a_locked: true,
      asr_called: ALLOW_ASR_EXECUTION,
      transcription_generated: ALLOW_AUDIO_TRANSCRIPTION,
      external_api_called: ALLOW_EXTERNAL_API_CALLS,
      download_called: ALLOW_MODEL_DOWNLOAD
    },
    blockers,
    next_action: completionStatus === 'ready_for_verification_rerun'
      ? "Execute full verification sequence to confirm dry-run readiness."
      : "Resolve missing operator staging items, place missing model files, adjust checksum entries in manifests, stage audio files, and rerun audit."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_operator_completion_audit_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR OPERATOR COMPLETION AUDIT COMPLETE");
  console.log("=========================================");
  console.log(`Summary Document: outputs/asr_operator_completion_audit/asr_operator_completion_audit_${dateStr}.md`);
  console.log(`JSON Manifest:    outputs/asr_operator_completion_audit/asr_operator_completion_audit_manifest_${dateStr}.json`);
  console.log(`Final Status:     ${completionStatus.toUpperCase()}`);
  console.log(`Staged Models:    ${allModelsPresent ? 'YES' : 'NO'}`);
  console.log(`Eligible Audios:  ${totalEligibleAudios}`);
  console.log("=========================================");

  await announceCompletion("ASR operator packet completion audit pass finished successfully.", "12");
}

runAudit().catch((err) => {
  console.error(`❌ Operator Packet Completion Audit error: ${(err as Error).message}`);
  process.exit(1);
});
