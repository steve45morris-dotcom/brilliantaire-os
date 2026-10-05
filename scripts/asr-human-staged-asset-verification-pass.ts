import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  EXPECTED_MODEL_DIRECTORY,
  EXPECTED_MODELS,
  CHECKSUM_MANIFEST_FILES,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  ALLOWED_AUDIO_EXTENSIONS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  REPO_ROOT
} from '../config/asr-human-staged-asset-verification-pass.js';
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

// Helper: Compute file SHA256 locally
function computeFileSHA256(filePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve(null);
    }
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', () => resolve(null));
    } catch (e) {
      resolve(null);
    }
  });
}

async function runVerification() {
  console.log("🚦 Starting ASR Human-Staged Asset Verification Pass (Phase 11Z-I)...");
  await announcePhrase("Knight standing by. Executing human staged asset verification pass.");
  await announceIntent("Verifying human manual staging and manifest entries.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // Define blockers list
  const blockers: string[] = [];

  // 1. Load and Compare Checksum Manifests
  const rootManifestPath = CHECKSUM_MANIFEST_FILES[0];
  const narratorManifestPath = CHECKSUM_MANIFEST_FILES[1];

  const rootManifestExists = fs.existsSync(rootManifestPath);
  const narratorManifestExists = fs.existsSync(narratorManifestPath);

  let rootManifestReadable = false;
  let narratorManifestReadable = false;
  let rootManifestData: any = null;
  let narratorManifestData: any = null;

  if (rootManifestExists) {
    try {
      const raw = fs.readFileSync(rootManifestPath, 'utf-8');
      rootManifestData = JSON.parse(raw);
      rootManifestReadable = true;
    } catch (e) {
      blockers.push(`Root manifest at ${path.basename(rootManifestPath)} is not readable or valid JSON.`);
    }
  } else {
    blockers.push(`Root manifest is missing at ${rootManifestPath}`);
  }

  if (narratorManifestExists) {
    try {
      const raw = fs.readFileSync(narratorManifestPath, 'utf-8');
      narratorManifestData = JSON.parse(raw);
      narratorManifestReadable = true;
    } catch (e) {
      blockers.push(`Narrator manifest at ${path.basename(narratorManifestPath)} is not readable or valid JSON.`);
    }
  } else {
    blockers.push(`Narrator manifest is missing at ${narratorManifestPath}`);
  }

  // Cross-compare entries
  let matchingModelEntries = 0;
  let conflictingModelEntries = 0;
  let missingRequiredFields = 0;
  let manifestConsistencyStatus: 'consistent' | 'conflict' | 'incomplete' = 'incomplete';

  if (rootManifestReadable && narratorManifestReadable) {
    const rootKeys = Object.keys(rootManifestData);
    const narratorKeys = Object.keys(narratorManifestData);

    const allModelFilenames = Array.from(new Set([...rootKeys, ...narratorKeys]));

    allModelFilenames.forEach(filename => {
      const rootEntry = rootManifestData[filename];
      const narratorEntry = narratorManifestData[filename];

      if (!rootEntry || !narratorEntry) {
        conflictingModelEntries++;
        return;
      }

      // Check required fields
      if (!rootEntry.expected_sha256 || rootEntry.file_size_bytes === undefined ||
          !narratorEntry.expected_sha256 || narratorEntry.file_size_bytes === undefined) {
        missingRequiredFields++;
      }

      // Compare checksum and file size
      if (rootEntry.expected_sha256 === narratorEntry.expected_sha256 &&
          rootEntry.file_size_bytes === narratorEntry.file_size_bytes) {
        matchingModelEntries++;
      } else {
        conflictingModelEntries++;
      }
    });

    if (conflictingModelEntries === 0 && missingRequiredFields === 0 && rootKeys.length > 0) {
      manifestConsistencyStatus = 'consistent';
    } else {
      manifestConsistencyStatus = 'conflict';
      blockers.push(`Manifest consistency check failed with ${conflictingModelEntries} conflicts and ${missingRequiredFields} missing fields.`);
    }
  } else {
    manifestConsistencyStatus = 'incomplete';
  }

  // 2. Verify Whisper Model Binaries
  const verifiedModels: any[] = [];
  let modelsVerifiedCount = 0;

  for (const model of EXPECTED_MODELS) {
    const fullPath = path.join(EXPECTED_MODEL_DIRECTORY, model.model_filename);
    const exists = fs.existsSync(fullPath);
    let readable = false;
    let sizeBytesActual: number | null = null;
    let sha256Actual: string | null = null;

    if (exists) {
      try {
        fs.accessSync(fullPath, fs.constants.R_OK);
        readable = true;
        sizeBytesActual = fs.statSync(fullPath).size;
        sha256Actual = await computeFileSHA256(fullPath);
      } catch (e) {
        blockers.push(`Model file ${model.model_filename} is unreadable.`);
      }
    } else {
      blockers.push(`Expected Whisper binary ${model.model_filename} is missing.`);
    }

    // Load values from root manifest
    const manifestEntry = rootManifestReadable && rootManifestData ? rootManifestData[model.model_filename] : null;
    const sha256Manifest = manifestEntry ? manifestEntry.expected_sha256 : null;
    const sizeBytesManifest = manifestEntry ? manifestEntry.file_size_bytes : null;

    const fileSizeMatch = sizeBytesActual !== null && sizeBytesManifest !== null && sizeBytesActual === sizeBytesManifest;
    const checksumMatch = sha256Actual !== null && sha256Manifest !== null && sha256Actual.toLowerCase() === sha256Manifest.toLowerCase();

    if (!sha256Manifest) {
      blockers.push(`SHA256 signature is missing from manifest for ${model.model_filename}.`);
    }
    if (exists && !fileSizeMatch) {
      blockers.push(`File size mismatch for ${model.model_filename}. Actual: ${sizeBytesActual}, Manifest: ${sizeBytesManifest}`);
    }
    if (exists && !checksumMatch) {
      blockers.push(`SHA256 checksum mismatch for ${model.model_filename}. Actual: ${sha256Actual}, Manifest: ${sha256Manifest}`);
    }

    const trustCandidateStatus = exists && readable && fileSizeMatch && checksumMatch ? 'dry_run_ready' : 'blocked';
    if (trustCandidateStatus === 'dry_run_ready') {
      modelsVerifiedCount++;
    }

    const nextAction = exists
      ? (fileSizeMatch && checksumMatch ? 'Staging complete.' : 'Recalculate SHA256 and update manifests.')
      : `Place binary in models/asr/whisper/ and configure checksum manifests.`;

    verifiedModels.push({
      model_filename: model.model_filename,
      expected_path: model.expected_path,
      exists,
      readable,
      size_bytes_actual: sizeBytesActual,
      size_bytes_manifest: sizeBytesManifest,
      file_size_match: fileSizeMatch,
      sha256_actual: sha256Actual,
      sha256_manifest: sha256Manifest,
      checksum_match: checksumMatch,
      trust_candidate_status: trustCandidateStatus,
      next_action: nextAction
    });
  }

  // 3. Verify Audio Staging Folder Metrics
  const folderMetrics: any[] = [];
  const discoveredAudioFiles: any[] = [];
  let totalDiscoveredFiles = 0;
  let totalEligibleFiles = 0;
  let totalRejectedFiles = 0;
  let audioIdCounter = 1;

  APPROVED_AUDIO_INPUT_DIRECTORIES.forEach(dir => {
    const relFolder = path.relative(REPO_ROOT, dir);
    const exists = fs.existsSync(dir);
    let readable = false;
    let fileCount = 0;
    let eligibleCount = 0;
    let rejectedCount = 0;
    let zeroByteCount = 0;
    let unsupportedExtCount = 0;

    if (exists) {
      try {
        fs.accessSync(dir, fs.constants.R_OK);
        readable = true;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') return;
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) return;

          fileCount++;
          totalDiscoveredFiles++;

          const ext = path.extname(file).toLowerCase();
          const isAcceptedExt = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
          const isSafeName = /^[a-zA-Z0-9_\-\.]+$/.test(file);
          const isNonZero = stat.size > 0;

          let fileReadable = false;
          try {
            fs.accessSync(fullPath, fs.constants.R_OK);
            fileReadable = true;
          } catch (_) {}

          let eligible = isAcceptedExt && isSafeName && isNonZero && fileReadable;
          let rejectionReason: string | null = null;

          if (!isAcceptedExt) {
            unsupportedExtCount++;
            rejectionReason = "Unsupported audio format extension.";
          } else if (!isNonZero) {
            zeroByteCount++;
            rejectionReason = "File size is zero bytes.";
          } else if (!isSafeName) {
            rejectionReason = "Filename contains unsafe characters.";
          } else if (!fileReadable) {
            rejectionReason = "File is unreadable.";
          }

          if (eligible) {
            eligibleCount++;
            totalEligibleFiles++;
          } else {
            rejectedCount++;
            totalRejectedFiles++;
          }

          const audioId = `audio_${String(audioIdCounter++).padStart(3, '0')}`;

          discoveredAudioFiles.push({
            audio_id: audioId,
            filename: file,
            local_path: path.relative(REPO_ROOT, fullPath),
            extension: ext,
            size_bytes: stat.size,
            accepted_extension: isAcceptedExt,
            safe_filename: isSafeName,
            readable: fileReadable,
            eligible_for_staging_gate: eligible,
            rejection_reason: rejectionReason,
            transcription_allowed: false
          });
        });
      } catch (e) {
        blockers.push(`Staging folder ${relFolder} is not readable.`);
      }
    } else {
      blockers.push(`Staging folder ${relFolder} does not exist.`);
    }

    folderMetrics.push({
      folder_path: relFolder,
      exists,
      readable,
      discovered_file_count: fileCount,
      eligible_file_count: eligibleCount,
      rejected_file_count: rejectedCount,
      zero_byte_file_count: zeroByteCount,
      unsupported_extension_count: unsupportedExtCount
    });
  });

  if (totalEligibleFiles === 0) {
    blockers.push("No eligible audio files staged across approved folders.");
  }

  // 4. Resolve human staged verification status
  let verificationStatus: 'blocked' | 'ready_for_gate_rerun' = 'blocked';

  const allExpectedModelsExist = verifiedModels.every(m => m.exists);
  const allExpectedModelsReadable = verifiedModels.every(m => m.readable);
  const allSha256Present = verifiedModels.every(m => m.sha256_actual !== null);
  const allChecksumsMatch = verifiedModels.every(m => m.checksum_match);
  const allSizesMatch = verifiedModels.every(m => m.file_size_match);

  const satisfiesAllConditions =
    allExpectedModelsExist &&
    allExpectedModelsReadable &&
    allSha256Present &&
    allChecksumsMatch &&
    allSizesMatch &&
    rootManifestExists &&
    narratorManifestExists &&
    manifestConsistencyStatus === 'consistent' &&
    totalEligibleFiles > 0 &&
    !ALLOW_ASR_EXECUTION &&
    !ALLOW_AUDIO_TRANSCRIPTION &&
    !ALLOW_EXTERNAL_API_CALLS &&
    !ALLOW_MODEL_DOWNLOAD;

  if (satisfiesAllConditions) {
    verificationStatus = 'ready_for_gate_rerun';
  } else {
    verificationStatus = 'blocked';
  }

  // 5. Template interpolation helper
  const loadAndReplaceTemplate = (templateName: string, replacements: Record<string, string>): string => {
    const tempPath = path.join(TEMPLATE_DIRECTORY, templateName);
    if (!fs.existsSync(tempPath)) {
      throw new Error(`Template not found: ${tempPath}`);
    }
    let content = fs.readFileSync(tempPath, 'utf-8');
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return content;
  };

  // Compile individual templates
  // a) Model entries
  let modelsTable = `| Model Filename | Expected Destination Path | Exists | Readable | Size Actual | Size Manifest | Size Match | Checksum Matches | Trust Status |\n`;
  modelsTable += `|---|---|---|---|---|---|---|---|---|\n`;
  verifiedModels.forEach(m => {
    modelsTable += `| \`${m.model_filename}\` | \`${m.expected_path}\` | \`${m.exists}\` | \`${m.readable}\` | ${m.size_bytes_actual !== null ? m.size_bytes_actual : '-'} | ${m.size_bytes_manifest !== null ? m.size_bytes_manifest : '-'} | \`${m.file_size_match}\` | \`${m.checksum_match}\` | \`${m.trust_candidate_status}\` |\n`;
  });
  const modelVerifMd = loadAndReplaceTemplate('asr-human-model-verification-template.md', {
    MODELS_TABLE: modelsTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_model_verification_${dateStr}.md`), modelVerifMd);

  // b) Checksum verification entries
  let checksumTable = `| Model Filename | Computed Local Hash | Manifest Configured Hash | Actual Size (Bytes) | Manifest Size (Bytes) | Verification Status |\n`;
  checksumTable += `|---|---|---|---|---|---|\n`;
  verifiedModels.forEach(m => {
    checksumTable += `| \`${m.model_filename}\` | \`${m.sha256_actual || '-'}\` | \`${m.sha256_manifest || '-'}\` | ${m.size_bytes_actual !== null ? m.size_bytes_actual : '-'} | ${m.size_bytes_manifest !== null ? m.size_bytes_manifest : '-'} | \`${m.checksum_match && m.file_size_match ? 'MATCH' : 'MISMATCH'}\` |\n`;
  });
  const checksumVerifMd = loadAndReplaceTemplate('asr-human-checksum-verification-template.md', {
    CHECKSUM_TABLE: checksumTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_checksum_verification_${dateStr}.md`), checksumVerifMd);

  // c) Audio verification
  let foldersTable = `| Staging Folder Path | Exists | Readable | Files Discovered | Eligible Files | Rejected Files | Zero-Byte Files | Unsupported Exts |\n`;
  foldersTable += `|---|---|---|---|---|---|---|---|\n`;
  folderMetrics.forEach(f => {
    foldersTable += `| \`${f.folder_path}\` | \`${f.exists}\` | \`${f.readable}\` | ${f.discovered_file_count} | ${f.eligible_file_count} | ${f.rejected_file_count} | ${f.zero_byte_file_count} | ${f.unsupported_extension_count} |\n`;
  });

  let filesTable = `| Audio ID | Filename | Staging Location | Extension | Size (Bytes) | Accepted Extension | Safe Name | Eligible | Rejection Reason |\n`;
  filesTable += `|---|---|---|---|---|---|---|---|---|\n`;
  if (discoveredAudioFiles.length > 0) {
    discoveredAudioFiles.forEach(f => {
      filesTable += `| \`${f.audio_id}\` | \`${f.filename}\` | \`${f.local_path}\` | \`${f.extension}\` | ${f.size_bytes} | \`${f.accepted_extension}\` | \`${f.safe_filename}\` | \`${f.eligible_for_staging_gate}\` | ${f.rejection_reason ? `\`${f.rejection_reason}\`` : '-'} |\n`;
    });
  } else {
    filesTable += `| - | No audio files discovered. | - | - | - | - | - | - | - |\n`;
  }
  const audioVerifMd = loadAndReplaceTemplate('asr-human-audio-verification-template.md', {
    FOLDERS_TABLE: foldersTable.trim(),
    FILES_TABLE: filesTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_audio_verification_${dateStr}.md`), audioVerifMd);

  // d) Manifest comparison
  const manifestComparisonMd = loadAndReplaceTemplate('asr-human-manifest-comparison-template.md', {
    ROOT_MANIFEST_EXISTS: String(rootManifestExists),
    NARRATOR_MANIFEST_EXISTS: String(narratorManifestExists),
    ROOT_MANIFEST_READABLE: String(rootManifestReadable),
    NARRATOR_MANIFEST_READABLE: String(narratorManifestReadable),
    MATCHING_ENTRIES: String(matchingModelEntries),
    CONFLICTING_ENTRIES: String(conflictingModelEntries),
    MISSING_FIELDS_COUNT: String(missingRequiredFields),
    MANIFEST_CONSISTENCY_STATUS: manifestConsistencyStatus.toUpperCase()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_manifest_comparison_${dateStr}.md`), manifestComparisonMd);

  // e) Blockers checklist
  let blockersChecklist = '';
  if (blockers.length > 0) {
    blockers.forEach(b => {
      blockersChecklist += `- [ ] ${b}\n`;
    });
  } else {
    blockersChecklist = `* **No active blockers.** All human staging verification checks passed successfully. Ready for gate rerun.\n`;
  }
  const blockersMd = loadAndReplaceTemplate('asr-human-blockers-template.md', {
    BLOCKERS_CHECKLIST: blockersChecklist.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_blockers_${dateStr}.md`), blockersMd);

  // f) Verification Summary
  const summaryMd = loadAndReplaceTemplate('asr-human-verification-summary-template.md', {
    VERIFICATION_STATUS: verificationStatus.toUpperCase()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_verification_summary_${dateStr}.md`), summaryMd);

  // g) Next actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-J: ASR Gate Rerun Orchestrator'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // h) Combined Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-human-staged-verification-report-template.md', {
    DATE: dateStr,
    MODELS_COUNT: String(EXPECTED_MODELS.length),
    MODELS_VERIFIED_COUNT: String(modelsVerifiedCount),
    MANIFEST_CONSISTENCY_STATUS: manifestConsistencyStatus.toUpperCase(),
    ELIGIBLE_AUDIO_COUNT: String(totalEligibleFiles),
    VERIFICATION_STATUS: verificationStatus.toUpperCase(),
    MODEL_VERIFICATION_DETAILS: modelVerifMd.trim(),
    CHECKSUM_VERIFICATION_DETAILS: checksumVerifMd.trim(),
    AUDIO_VERIFICATION_DETAILS: audioVerifMd.trim(),
    MANIFEST_COMPARISON_DETAILS: manifestComparisonMd.trim(),
    BLOCKER_DETAILS: blockersMd.trim(),
    SUMMARY_DETAILS: summaryMd.trim(),
    NEXT_ACTION_DETAILS: nextActionsMd.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_staged_verification_report_${dateStr}.md`), masterReportMd);

  // 6. Write JSON manifest manifest
  const jsonManifest = {
    ledger_id: `asr_human_staged_verification_${dateStr}`,
    manifest_version: "1.0",
    verification_date: dateStr,
    verification_rollup: {
      total_models_tracked: EXPECTED_MODELS.length,
      models_verified_count: modelsVerifiedCount,
      manifests_consistent: manifestConsistencyStatus === 'consistent',
      audio_folders_scanned: APPROVED_AUDIO_INPUT_DIRECTORIES.length,
      audio_files_discovered: totalDiscoveredFiles,
      eligible_audio_files: totalEligibleFiles,
      rejected_audio_files: totalRejectedFiles,
      human_staged_verification_status: verificationStatus
    },
    verified_models: verifiedModels,
    manifest_comparison: {
      root_manifest_exists: rootManifestExists,
      narrator_manifest_exists: narratorManifestExists,
      root_manifest_readable: rootManifestReadable,
      narrator_manifest_readable: narratorManifestReadable,
      matching_model_entries: matchingModelEntries,
      conflicting_model_entries: conflictingModelEntries,
      missing_required_fields: missingRequiredFields,
      manifest_consistency_status: manifestConsistencyStatus
    },
    folder_metrics: folderMetrics,
    discovered_audio_files: discoveredAudioFiles,
    safety_locks: {
      phase_12a_blocked: true,
      asr_called: false,
      transcription_generated: false,
      external_api_called: false,
      download_called: false
    },
    blockers: blockers,
    next_action: verificationStatus === 'ready_for_gate_rerun'
      ? "Execute rerun sequence checklist to confirm dry-run readiness."
      : "Address staging gaps and manifests mismatches, then rerun human staged asset verification pass."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_human_staged_verification_manifest_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR HUMAN VERIFICATION PASS COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report: outputs/asr_human_staged_verification/asr_human_staged_verification_report_${dateStr}.md`);
  console.log(`JSON Manifest:  outputs/asr_human_staged_verification/asr_human_staged_verification_manifest_${dateStr}.json`);
  console.log(`Verification Status: ${verificationStatus.toUpperCase()}`);
  console.log(`Models Staged: ${modelsVerifiedCount} / ${EXPECTED_MODELS.length}`);
  console.log(`Audios Eligible: ${totalEligibleFiles}`);
  console.log("=========================================");

  await announceCompletion("ASR human verification pass compiled successfully.", "12");
}

runVerification().catch((err) => {
  console.error(`❌ Human-staged verification error: ${(err as Error).message}`);
  process.exit(1);
});
