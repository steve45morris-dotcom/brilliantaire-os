import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  GATE_MANIFESTS,
  EXPECTED_MODEL_DIRECTORY,
  EXPECTED_MODELS,
  CHECKSUM_MANIFEST_FILES,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  ALLOWED_AUDIO_EXTENSIONS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  REPO_ROOT
} from '../config/asr-manual-asset-revalidation-pass.js';
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

async function runRevalidationPass() {
  console.log("🚦 Starting ASR Manual Asset Revalidation Pass (Phase 11Z-G)...");
  await announcePhrase("Knight standing by. Executing manual asset revalidation pass.");
  await announceIntent("Running ASR manual asset revalidation pass.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  const blockers: string[] = [];

  // 1. Audit Checksums Manifest files on disk
  let manifestsReady = true;
  let manifestReadinessStatus: 'complete' | 'incomplete' = 'complete';
  for (const mPath of CHECKSUM_MANIFEST_FILES) {
    const relPath = path.relative(REPO_ROOT, mPath);
    if (!fs.existsSync(mPath)) {
      manifestsReady = false;
      manifestReadinessStatus = 'incomplete';
      blockers.push(`Checksum manifest is missing on disk: ${relPath}`);
    } else {
      try {
        const raw = fs.readFileSync(mPath, 'utf-8');
        const json = JSON.parse(raw);
        const modelsObject = json.models || json.inspected_entries || (json['ggml-base.en.bin'] ? json : {});
        
        let filenamesInManifest: string[] = [];
        if (Array.isArray(modelsObject)) {
          filenamesInManifest = modelsObject.map(m => m.model_filename || m.filename);
        } else {
          filenamesInManifest = Object.keys(modelsObject);
        }

        const containsModels = EXPECTED_MODELS.every(model => {
          return filenamesInManifest.some(name => name && name.toLowerCase().includes(model.toLowerCase()));
        });

        if (!containsModels) {
          manifestsReady = false;
          manifestReadinessStatus = 'incomplete';
          blockers.push(`Checksum manifest lacks entries for all expected models: ${relPath}`);
        }
      } catch (err) {
        manifestsReady = false;
        manifestReadinessStatus = 'incomplete';
        blockers.push(`Checksum manifest is unreadable or contains invalid JSON: ${relPath}`);
      }
    }
  }

  // 2. Audit Model Files on disk
  const discoveredModels: string[] = [];
  const missingModels: string[] = [];
  for (const model of EXPECTED_MODELS) {
    const modelPath = path.join(EXPECTED_MODEL_DIRECTORY, model);
    if (fs.existsSync(modelPath)) {
      discoveredModels.push(model);
    } else {
      missingModels.push(model);
    }
  }

  if (missingModels.length > 0) {
    blockers.push(`Required Whisper model binaries are missing from disk: ${missingModels.join(', ')}`);
  }

  // 3. Audit Approved Audio folders
  let audioFilesCount = 0;
  for (const dir of APPROVED_AUDIO_INPUT_DIRECTORIES) {
    const relPath = path.relative(REPO_ROOT, dir);
    if (!fs.existsSync(dir)) {
      blockers.push(`Approved audio directory is missing: ${relPath}`);
    } else {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') continue;
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile() && ALLOWED_AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase()) && stat.size > 0) {
            audioFilesCount++;
          }
        }
      } catch (e) {
        blockers.push(`Approved audio directory is unreadable: ${relPath}`);
      }
    }
  }

  if (audioFilesCount === 0) {
    blockers.push("No eligible local audio files staged. At least one non-empty audio file is required.");
  }

  // 4. Load Source Gate Manifests
  const GATE_MANIFESTS = {
    checksum: path.join(REPO_ROOT, 'outputs', 'asr_validation', `asr_checksum_validation_manifest_${dateStr}.json`),
    audio_staging: path.join(REPO_ROOT, 'outputs', 'asr_audio_staging', `asr_audio_staging_manifest_${dateStr}.json`),
    readiness_join: path.join(REPO_ROOT, 'outputs', 'asr_readiness_join', `asr_readiness_join_manifest_${dateStr}.json`),
    asset_preflight: path.join(REPO_ROOT, 'outputs', 'asr_asset_preflight', `asr_asset_preflight_manifest_${dateStr}.json`)
  };

  let checksumManifestData: any = null;
  let audioStagingManifestData: any = null;
  let readinessJoinManifestData: any = null;
  let assetPreflightManifestData: any = null;

  const loadManifest = (gateName: 'checksum' | 'audio_staging' | 'readiness_join' | 'asset_preflight') => {
    const mPath = GATE_MANIFESTS[gateName];
    const relPath = path.relative(REPO_ROOT, mPath);
    if (fs.existsSync(mPath)) {
      try {
        return JSON.parse(fs.readFileSync(mPath, 'utf-8'));
      } catch (e) {
        blockers.push(`Source manifest for ${gateName} is unreadable: ${relPath}`);
      }
    } else {
      blockers.push(`Source manifest for ${gateName} is missing: ${relPath}`);
    }
    return null;
  };

  checksumManifestData = loadManifest('checksum');
  audioStagingManifestData = loadManifest('audio_staging');
  readinessJoinManifestData = loadManifest('readiness_join');
  assetPreflightManifestData = loadManifest('asset_preflight');

  // Parse fields from checksum manifest
  const checksumMatches = checksumManifestData?.checks_metrics?.checksum_matches ?? 0;
  const checksumMismatches = checksumManifestData?.checks_metrics?.checksum_mismatches ?? 0;
  const modelTrustStatus = checksumManifestData?.checks_metrics?.final_model_trust_status ?? 'blocked';

  // Parse fields from audio staging manifest
  const audioDiscovered = audioStagingManifestData?.audio_readiness_metrics?.discovered_files_count ?? 0;
  const eligibleAudioFiles = audioStagingManifestData?.audio_readiness_metrics?.eligible_files_count ?? 0;
  const rejectedAudioFiles = audioStagingManifestData?.audio_readiness_metrics?.rejected_files_count ?? 0;

  // Parse fields from readiness join manifest
  const routePreviewsMapped = readinessJoinManifestData?.metrics?.route_previews_mapped ?? 0;
  const joinedReadinessStatus = readinessJoinManifestData?.metrics?.readiness_status ?? 'blocked';

  // Parse fields from asset preflight manifest
  const preflightStatus = assetPreflightManifestData?.preflight_status ?? 'blocked';

  // Check manifest readiness status from preflight or config check
  if (assetPreflightManifestData) {
    const isManifestReady = assetPreflightManifestData.scanned_manifests?.every(
      (m: any) => m.manifest_presence_status === 'ready'
    );
    if (!isManifestReady) {
      manifestReadinessStatus = 'incomplete';
    }
  }

  // 5. Revalidation Decision Logic
  let finalRevalidationStatus: 'blocked' | 'dry_run_ready' = 'blocked';

  // Gather all gate blocking conditions
  const conditions = {
    missingModelBinaries: missingModels.length > 0,
    manifestIncomplete: manifestReadinessStatus === 'incomplete',
    zeroChecksumMatches: checksumMatches === 0,
    checksumMismatchesExist: checksumMismatches > 0,
    modelTrustBlocked: modelTrustStatus === 'blocked',
    noEligibleAudio: eligibleAudioFiles === 0,
    noRoutesMapped: routePreviewsMapped === 0,
    joinedReadinessBlocked: joinedReadinessStatus === 'blocked',
    preflightBlocked: preflightStatus === 'blocked',
    sourceManifestMissing: !checksumManifestData || !audioStagingManifestData || !readinessJoinManifestData || !assetPreflightManifestData
  };

  if (
    !conditions.missingModelBinaries &&
    !conditions.manifestIncomplete &&
    checksumMatches > 0 &&
    checksumMismatches === 0 &&
    modelTrustStatus === 'dry_run_ready' &&
    eligibleAudioFiles > 0 &&
    routePreviewsMapped > 0 &&
    joinedReadinessStatus === 'dry_run_ready' &&
    preflightStatus === 'ready_for_revalidation' &&
    !conditions.sourceManifestMissing
  ) {
    finalRevalidationStatus = 'dry_run_ready';
  } else {
    finalRevalidationStatus = 'blocked';
    
    // Supplement blockers list with logic-based warnings if not already logged
    if (conditions.missingModelBinaries) blockers.push("Revalidation Blocked: Whisper model files are physically missing.");
    if (conditions.manifestIncomplete) blockers.push("Revalidation Blocked: Checksum manifests are incomplete or structurally incorrect.");
    if (conditions.zeroChecksumMatches) blockers.push("Revalidation Blocked: 0 cryptographic checksum matches verified.");
    if (conditions.checksumMismatchesExist) blockers.push("Revalidation Blocked: Checksum mismatches detected on staging models.");
    if (conditions.modelTrustBlocked) blockers.push("Revalidation Blocked: Model trust status is blocked.");
    if (conditions.noEligibleAudio) blockers.push("Revalidation Blocked: Eligible audio staging count is 0.");
    if (conditions.noRoutesMapped) blockers.push("Revalidation Blocked: Mapped route count is 0.");
    if (conditions.joinedReadinessBlocked) blockers.push("Revalidation Blocked: Joined ASR readiness status is blocked.");
    if (conditions.preflightBlocked) blockers.push("Revalidation Blocked: Presence preflight state is blocked.");
  }

  // 6. Template replacements
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
  // a) Model Result
  let modelsTable = `| Model Filename | Expected Destination Path | Exists | Trust Status |\n`;
  modelsTable += `|---|---|---|---|\n`;
  EXPECTED_MODELS.forEach(m => {
    const modelPath = path.join(EXPECTED_MODEL_DIRECTORY, m);
    const exists = fs.existsSync(modelPath);
    modelsTable += `| \`${m}\` | \`models/asr/whisper/${m}\` | \`${exists}\` | \`${modelTrustStatus}\` |\n`;
  });
  const modelResultMd = loadAndReplaceTemplate('asr-revalidation-model-result-template.md', {
    MODELS_TABLE: modelsTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_revalidation_model_result_${dateStr}.md`), modelResultMd);

  // b) Audio Result
  let audiosTable = `| Approved Folder | Discovered | Eligible | Rejected | Staging Gate Status |\n`;
  audiosTable += `|---|---|---|---|---|\n`;
  APPROVED_AUDIO_INPUT_DIRECTORIES.forEach(d => {
    const rel = path.relative(REPO_ROOT, d);
    const exists = fs.existsSync(d);
    audiosTable += `| \`${rel}\` | ${audioDiscovered} | ${eligibleAudioFiles} | ${rejectedAudioFiles} | \`${exists ? 'inspected' : 'missing'}\` |\n`;
  });
  const audioResultMd = loadAndReplaceTemplate('asr-revalidation-audio-result-template.md', {
    AUDIOS_TABLE: audiosTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_revalidation_audio_result_${dateStr}.md`), audioResultMd);

  // c) Readiness Result
  const readinessResultMd = loadAndReplaceTemplate('asr-revalidation-readiness-result-template.md', {
    JOINED_MANIFEST_STATUS: joinedReadinessStatus,
    MODEL_TRUST_LEVEL: modelTrustStatus,
    STAGED_AUDIO_COUNT: String(eligibleAudioFiles),
    ROUTE_PREVIEWS_COUNT: String(routePreviewsMapped)
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_revalidation_readiness_result_${dateStr}.md`), readinessResultMd);

  // d) Check blockers
  let blockersChecklist = '';
  if (blockers.length > 0) {
    blockers.forEach((b, idx) => {
      blockersChecklist += `${idx + 1}. [ ] **Revalidation Blocker:** ${b}\n`;
    });
  } else {
    blockersChecklist = `* No blockers remaining. Staging environment validated for offline ASR dry-run execution.`;
  }
  const revalBlockersMd = loadAndReplaceTemplate('asr-revalidation-blockers-template.md', {
    BLOCKERS_CHECKLIST: blockersChecklist.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_revalidation_blockers_${dateStr}.md`), revalBlockersMd);

  // e) Summary
  const summaryMd = loadAndReplaceTemplate('asr-revalidation-summary-template.md', {
    DATE: dateStr,
    FINAL_REVAL_STATUS: finalRevalidationStatus,
    MODEL_TRUST_LEVEL: modelTrustStatus,
    AUDIO_FILES_FOUND: String(audioDiscovered),
    ROUTE_PREVIEWS_COUNT: String(routePreviewsMapped),
    PREFLIGHT_STATUS: preflightStatus,
    ASR_CALLED: 'false',
    TRANSCRIPTION_GENERATED: 'false',
    EXTERNAL_API_CALLED: '0',
    DOWNLOAD_CALLED: '0'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_revalidation_summary_${dateStr}.md`), summaryMd);

  // f) Next Actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 12A: Offline ASR Execution Approval Switch'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // g) Combined Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-revalidation-report-template.md', {
    DATE: dateStr,
    FINAL_REVAL_STATUS: finalRevalidationStatus,
    MODEL_PRESENCE_STATUS: missingModels.length === 0 ? 'verified' : 'blocked',
    MANIFEST_READINESS_STATUS: manifestReadinessStatus,
    AUDIO_PRESENCE_STATUS: eligibleAudioFiles > 0 ? 'verified' : 'blocked',
    JOINED_READINESS_STATUS: joinedReadinessStatus,
    PREFLIGHT_STATUS: preflightStatus,
    MODEL_REVAL_DETAILS: modelResultMd.trim(),
    AUDIO_REVAL_DETAILS: audioResultMd.trim(),
    READINESS_REVAL_DETAILS: readinessResultMd.trim(),
    BLOCKERS_LIST: blockers.length > 0 ? blockers.map(b => `* ⚠️ **Revalidation Blocker:** ${b}`).join('\n') : '* No blockers identified.',
    ASR_CALLED: 'false',
    TRANSCRIPTION_GENERATED: 'false',
    EXTERNAL_API_CALLED: 'false',
    DOWNLOAD_CALLED: 'false',
    NEXT_PHASE_RECOMMENDATION: 'Phase 12A: Offline ASR Execution Approval Switch'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_revalidation_report_${dateStr}.md`), masterReportMd);

  // 7. Write consolidated JSON Manifest
  const manifestOut = {
    revalidation_id: `asr_revalidation_manifest_${dateStr}`,
    manifest_version: "1.0",
    audit_date: dateStr,
    final_revalidation_status: finalRevalidationStatus,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    revalidation_metrics: {
      model_files_present: discoveredModels,
      model_files_missing: missingModels,
      manifest_readiness_status: manifestReadinessStatus,
      checksum_matches: checksumMatches,
      checksum_mismatches: checksumMismatches,
      model_trust_status: modelTrustStatus,
      audio_files_discovered: audioDiscovered,
      eligible_audio_files: eligibleAudioFiles,
      rejected_audio_files: rejectedAudioFiles,
      route_previews_mapped: routePreviewsMapped,
      joined_readiness_status: joinedReadinessStatus,
      preflight_status: preflightStatus
    },
    blockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: finalRevalidationStatus === 'dry_run_ready'
      ? 'ASR revalidation pass completed successfully. Proceed to stage human-controlled execution approval switch (Phase 12A).'
      : 'Human operator must stage Whisper binaries, complete manifest updates, place eligible audios, rerun underlying validation gates, and execute this pass again.'
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_revalidation_manifest_${dateStr}.json`),
    JSON.stringify(manifestOut, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR REVALIDATION PASS COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report: outputs/asr_revalidation/asr_revalidation_summary_${dateStr}.md`);
  console.log(`Manifest:       outputs/asr_revalidation/asr_revalidation_manifest_${dateStr}.json`);
  console.log(`Final Status:   ${finalRevalidationStatus.toUpperCase()}`);
  console.log(`Models Present: ${discoveredModels.join(', ') || 'None'}`);
  console.log(`Audios Found:   ${eligibleAudioFiles} eligible audio files`);
  console.log("=========================================");

  await announceCompletion("ASR manual asset revalidation pass completed successfully.", "12");
}

runRevalidationPass().catch((err) => {
  console.error(`❌ Revalidation execution error: ${(err as Error).message}`);
  process.exit(1);
});
