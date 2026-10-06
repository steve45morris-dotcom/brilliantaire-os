import fs from 'fs';
import path from 'path';
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
} from '../config/asr-asset-acquisition-ledger.js';
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

async function runLedgerCompiler() {
  console.log("🚦 Starting ASR Asset Acquisition Ledger Compilation (Phase 11Z-H)...");
  await announcePhrase("Knight standing by. Compiling manual asset acquisition ledger.");
  await announceIntent("Compiling ASR asset acquisition ledger.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // Load Manifests for Updates Check
  let rootManifestEntries: Record<string, any> = {};
  let narratorManifestEntries: Record<string, any> = {};

  const loadManifest = (mPath: string): Record<string, any> => {
    if (fs.existsSync(mPath)) {
      try {
        const raw = fs.readFileSync(mPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed.models || parsed.inspected_entries || parsed || {};
      } catch (e) {
        console.warn(`[Ledger Warning] Failed to parse manifest: ${mPath}`);
      }
    }
    return {};
  };

  const rootM = loadManifest(CHECKSUM_MANIFEST_FILES[0]);
  const narratorM = loadManifest(CHECKSUM_MANIFEST_FILES[1]);

  const extractModelFilenames = (manifestObj: any): string[] => {
    if (Array.isArray(manifestObj)) {
      return manifestObj.map(m => m.model_filename || m.filename).filter(Boolean);
    }
    return Object.keys(manifestObj);
  };

  const rootModelList = extractModelFilenames(rootM);
  const narratorModelList = extractModelFilenames(narratorM);

  // 1. Audit Whisper Model Binaries
  const trackedModels = EXPECTED_MODELS.map(model => {
    const fullPath = path.join(EXPECTED_MODEL_DIRECTORY, model.model_filename);
    const presentLocally = fs.existsSync(fullPath);
    let fileSize: number | null = null;
    
    if (presentLocally) {
      try {
        fileSize = fs.statSync(fullPath).size;
      } catch (e) {
        console.warn(`[Ledger Warning] Failed to read stat for ${model.model_filename}`);
      }
    }

    const manifestUpdatedRoot = rootModelList.some(name => name.toLowerCase().includes(model.model_filename.toLowerCase()));
    const manifestUpdatedNarratorPath = narratorModelList.some(name => name.toLowerCase().includes(model.model_filename.toLowerCase()));

    // trust_status and verification logic
    const trustStatus = presentLocally && manifestUpdatedRoot && manifestUpdatedNarratorPath ? 'dry_run_ready' : 'blocked';
    const humanVerificationStatus = presentLocally ? 'verified' : 'pending';
    const nextAction = presentLocally
      ? (manifestUpdatedRoot && manifestUpdatedNarratorPath ? 'Ready. Asset staged and manifests updated.' : 'Register file size and local SHA256 in manifests.')
      : `Manually download ${model.model_filename} and place in models/asr/whisper/.`;

    return {
      model_id: model.model_id,
      model_filename: model.model_filename,
      expected_path: model.expected_path,
      present_locally: presentLocally,
      manual_source_note: "Must be manually staged by the human operator.",
      acquisition_method: "manual_only" as const,
      download_allowed: false,
      asr_execution_allowed: false,
      external_api_allowed: false,
      expected_sha256: model.expected_sha256,
      actual_sha256: null, // Left to validation gate (Phase 11Z-C) to compute
      file_size_bytes: fileSize,
      manifest_updated_root: manifestUpdatedRoot,
      manifest_updated_narrator_path: manifestUpdatedNarratorPath,
      trust_status: trustStatus,
      human_verification_status: humanVerificationStatus,
      next_action: nextAction
    };
  });

  // 2. Audit Staged Audio Files
  const stagedAudioFiles: any[] = [];
  let audioIdCounter = 1;

  APPROVED_AUDIO_INPUT_DIRECTORIES.forEach(dir => {
    const relFolder = path.relative(REPO_ROOT, dir);
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') return;
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (!stat.isFile()) return;

          const ext = path.extname(file).toLowerCase();
          const isAcceptedExt = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
          const isSafeFilename = /^[a-zA-Z0-9_\-\.]+$/.test(file);
          const eligible = isAcceptedExt && stat.size > 0 && isSafeFilename;

          const audioId = `audio_${String(audioIdCounter++).padStart(3, '0')}`;
          
          stagedAudioFiles.push({
            audio_id: audioId,
            filename: file,
            folder: relFolder,
            extension: ext,
            size_bytes: stat.size,
            present_locally: true,
            accepted_extension: isAcceptedExt,
            safe_filename: isSafeFilename,
            eligible_for_staging_gate: eligible,
            transcription_allowed: false,
            next_action: eligible ? 'Eligible for staging. Ready for validation pass.' : 'Ensure file size is non-zero, filename is safe, and extension is supported.'
          });
        });
      } catch (e) {
        console.warn(`[Ledger Warning] Failed to read audio folder: ${relFolder}`);
      }
    }
  });

  const modelsPresentCount = trackedModels.filter(m => m.present_locally).length;
  const modelsMissingCount = trackedModels.filter(m => !m.present_locally).length;

  // 3. Template interpolation helper
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
  // a) Model Entries
  let modelsTable = `| Model ID | Filename | Expected Destination Path | Present Locally | Method | Expected SHA256 | Size (Bytes) | Trust Status |\n`;
  modelsTable += `|---|---|---|---|---|---|---|---|\n`;
  trackedModels.forEach(m => {
    modelsTable += `| \`${m.model_id}\` | \`${m.model_filename}\` | \`${m.expected_path}\` | \`${m.present_locally}\` | \`${m.acquisition_method}\` | \`${m.expected_sha256}\` | ${m.file_size_bytes !== null ? m.file_size_bytes : '-'} | \`${m.trust_status}\` |\n`;
  });
  const modelEntriesMd = loadAndReplaceTemplate('asr-model-acquisition-entry-template.md', {
    MODELS_TABLE: modelsTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_acquisition_entries_${dateStr}.md`), modelEntriesMd);

  // b) Checksum manifest updates
  let checksumTable = `| Manifest File Path | Exists | Listed Root | Listed Narrator | Update Action |\n`;
  checksumTable += `|---|---|---|---|---|\n`;
  CHECKSUM_MANIFEST_FILES.forEach(mPath => {
    const rel = path.relative(REPO_ROOT, mPath);
    const exists = fs.existsSync(mPath);
    const updatedRoot = rootModelList.length > 0;
    const updatedNarrator = narratorModelList.length > 0;
    checksumTable += `| \`${rel}\` | \`${exists}\` | \`${updatedRoot}\` | \`${updatedNarrator}\` | Populate hashes/sizes manually if not listed. |\n`;
  });
  const checksumRecordsMd = loadAndReplaceTemplate('asr-checksum-record-template.md', {
    CHECKSUM_TABLE: checksumTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_checksum_records_${dateStr}.md`), checksumRecordsMd);

  // c) Audio entries
  let audiosTable = `| Audio ID | Filename | Folder | Size (Bytes) | Extension | Accepted | Safe Name | Staging Eligible |\n`;
  audiosTable += `|---|---|---|---|---|---|---|---|\n`;
  if (stagedAudioFiles.length > 0) {
    stagedAudioFiles.forEach(f => {
      audiosTable += `| \`${f.audio_id}\` | \`${f.filename}\` | \`${f.folder}\` | ${f.size_bytes} | \`${f.extension}\` | \`${f.accepted_extension}\` | \`${f.safe_filename}\` | \`${f.eligible_for_staging_gate}\` |\n`;
    });
  } else {
    audiosTable += `| - | No audio files staged. | - | - | - | - | - | - |\n`;
  }
  const audioStagingMd = loadAndReplaceTemplate('asr-audio-staging-entry-template.md', {
    AUDIOS_TABLE: audiosTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_staging_entries_${dateStr}.md`), audioStagingMd);

  // d) Human handoff checklist
  const humanHandoffMd = loadAndReplaceTemplate('asr-human-handoff-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_human_handoff_${dateStr}.md`), humanHandoffMd);

  // e) Validation Rerun Sequence
  const rerunSequenceMd = loadAndReplaceTemplate('asr-validation-rerun-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_validation_rerun_sequence_${dateStr}.md`), rerunSequenceMd);

  // f) Safety Lock
  const safetyLockMd = loadAndReplaceTemplate('asr-safety-lock-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_safety_lock_${dateStr}.md`), safetyLockMd);

  // g) Next Actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-I: Human-Staged Asset Verification Pass'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // h) Combined Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-asset-ledger-template.md', {
    DATE: dateStr,
    MODELS_COUNT: String(EXPECTED_MODELS.length),
    MODELS_PRESENT_COUNT: String(modelsPresentCount),
    MODELS_MISSING_COUNT: String(modelsMissingCount),
    AUDIO_FOLDERS_COUNT: String(APPROVED_AUDIO_INPUT_DIRECTORIES.length),
    STAGED_AUDIO_COUNT: String(stagedAudioFiles.length),
    MODEL_ACQUISITION_DETAILS: modelEntriesMd.trim(),
    CHECKSUM_RECORDS: checksumRecordsMd.trim(),
    AUDIO_STAGING_DETAILS: audioStagingMd.trim(),
    HUMAN_HANDOFF: humanHandoffMd.trim(),
    RERUN_SEQUENCE: rerunSequenceMd.trim(),
    SAFETY_LOCK: safetyLockMd.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_asset_acquisition_ledger_${dateStr}.md`), masterReportMd);

  // 4. Write structured JSON ledger manifest
  const jsonManifest = {
    ledger_id: `asr_asset_acquisition_ledger_${dateStr}`,
    manifest_version: "1.0",
    audit_date: dateStr,
    ledger_rollup: {
      total_models_tracked: EXPECTED_MODELS.length,
      models_present_count: modelsPresentCount,
      models_missing_count: modelsMissingCount,
      audio_folders_scanned: APPROVED_AUDIO_INPUT_DIRECTORIES.length,
      staged_audio_discovered_count: stagedAudioFiles.length,
      eligible_audio_files_count: stagedAudioFiles.filter(a => a.eligible_for_staging_gate).length
    },
    tracked_models: trackedModels,
    scanned_audio_files: stagedAudioFiles,
    rerun_sequence: [
      'npm run command -- "asr-manual-asset-presence-preflight"',
      'npm run command -- "asr-checksum-manifest-validation-gate"',
      'npm run command -- "asr-audio-input-staging-validation-gate"',
      'npm run command -- "asr-readiness-join-gate"',
      'npm run command -- "asr-manual-asset-revalidation-pass"'
    ],
    safety_locks: {
      phase_12a_blocked: true,
      asr_called: false,
      transcription_generated: false,
      external_api_called: false,
      download_called: false,
      auto_model_acquisition_allowed: false,
      auto_manifest_correction_allowed: false
    },
    next_action: "Human must manually download Whisper models and stage approved audio files before running verification pass (Phase 11Z-I)."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_asset_acquisition_ledger_${dateStr}.json`),
    JSON.stringify(jsonManifest, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR ASSET LEDGER COMPILATION COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report: outputs/asr_asset_ledger/asr_asset_acquisition_ledger_${dateStr}.md`);
  console.log(`JSON Ledger:    outputs/asr_asset_ledger/asr_asset_acquisition_ledger_${dateStr}.json`);
  console.log(`Models Present: ${modelsPresentCount} / ${EXPECTED_MODELS.length}`);
  console.log(`Audios Staged:  ${stagedAudioFiles.length}`);
  console.log("=========================================");

  await announceCompletion("ASR asset acquisition ledger compiled successfully.", "12");
}

runLedgerCompiler().catch((err) => {
  console.error(`❌ Ledger compiler error: ${(err as Error).message}`);
  process.exit(1);
});
