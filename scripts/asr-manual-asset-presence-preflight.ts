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
  TEMPLATE_DIRECTORY
} from '../config/asr-manual-asset-presence-preflight.js';
import { announceIntent, announceCompletion, announcePhrase } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// Helper: Formatted Date YYYY-MM-DD
function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface InspectedModel {
  model_filename: string;
  expected_path: string;
  exists: boolean;
  size_bytes: number | null;
  readable: boolean;
  presence_status: 'present' | 'missing' | 'unreadable';
  next_action: string;
}

interface InspectedManifest {
  manifest_path: string;
  exists: boolean;
  readable: boolean;
  contains_expected_model_entries: boolean;
  contains_expected_sha256_fields: boolean;
  contains_file_size_fields: boolean;
  manifest_presence_status: 'ready' | 'missing' | 'incomplete' | 'unreadable';
  next_action: string;
}

interface InspectedFolder {
  folder_path: string;
  exists: boolean;
  readable: boolean;
  discovered_file_count: number;
  accepted_extension_count: number;
  unsupported_extension_count: number;
  zero_byte_file_count: number;
  audio_presence_status: 'active_staged' | 'empty' | 'unreadable' | 'missing';
  next_action: string;
}

async function runPresencePreflightGate() {
  console.log("🚦 Starting ASR Manual Asset Presence Preflight Gate (Phase 11Z-F2)...");
  await announcePhrase("Knight standing by. Executing manual asset presence preflight checks.");
  await announceIntent("Running ASR manual asset presence preflight gate.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // 1. Audit Model Presence
  const inspectedModels: InspectedModel[] = [];
  let modelBlockerCount = 0;

  for (const model of EXPECTED_MODELS) {
    const modelPath = path.join(EXPECTED_MODEL_DIRECTORY, model);
    const relPath = path.relative(REPO_ROOT, modelPath);
    let exists = false;
    let sizeBytes: number | null = null;
    let readable = false;
    let status: InspectedModel['presence_status'] = 'missing';
    let next_action = '';

    if (fs.existsSync(modelPath)) {
      exists = true;
      try {
        const stat = fs.statSync(modelPath);
        sizeBytes = stat.size;
        fs.accessSync(modelPath, fs.constants.R_OK);
        readable = true;
        status = 'present';
        next_action = 'No action required. Binary is staged and readable.';
      } catch (err) {
        status = 'unreadable';
        next_action = 'Ensure local file permissions allow reading.';
        modelBlockerCount++;
      }
    } else {
      next_action = `Stage ${model} manually inside /models/asr/whisper/ directory.`;
      modelBlockerCount++;
    }

    inspectedModels.push({
      model_filename: model,
      expected_path: relPath,
      exists,
      size_bytes: sizeBytes,
      readable,
      presence_status: status,
      next_action
    });
  }

  // 2. Audit Manifest Presence
  const inspectedManifests: InspectedManifest[] = [];
  let manifestBlockerCount = 0;

  for (const manifestFile of CHECKSUM_MANIFEST_FILES) {
    const relPath = path.relative(REPO_ROOT, manifestFile);
    let exists = false;
    let readable = false;
    let contains_expected_model_entries = false;
    let contains_expected_sha256_fields = false;
    let contains_file_size_fields = false;
    let status: InspectedManifest['manifest_presence_status'] = 'missing';
    let next_action = '';

    if (fs.existsSync(manifestFile)) {
      exists = true;
      try {
        fs.accessSync(manifestFile, fs.constants.R_OK);
        readable = true;
        
        // Parse and validate schema
        const manifestRaw = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
        const modelsObject = manifestRaw.models || manifestRaw.inspected_entries || (manifestRaw['ggml-base.en.bin'] ? manifestRaw : {});
        
        // Convert to array of filenames
        let filenamesInManifest: string[] = [];
        if (Array.isArray(modelsObject)) {
          filenamesInManifest = modelsObject.map(m => m.model_filename || m.filename);
        } else {
          filenamesInManifest = Object.keys(modelsObject);
        }

        // Check if required model entries are present
        contains_expected_model_entries = EXPECTED_MODELS.every(model => {
          return filenamesInManifest.some(name => name && name.toLowerCase().includes(model.toLowerCase()));
        });

        // Check if hashes and size properties are present in those entries
        if (Array.isArray(modelsObject)) {
          contains_expected_sha256_fields = modelsObject.every(m => m.expected_sha256 || m.sha256);
          contains_file_size_fields = modelsObject.every(m => m.file_size_bytes || m.size_bytes);
        } else {
          contains_expected_sha256_fields = Object.values(modelsObject).every((m: any) => m.expected_sha256 || m.sha256);
          contains_file_size_fields = Object.values(modelsObject).every((m: any) => m.file_size_bytes || m.size_bytes);
        }

        if (contains_expected_model_entries && contains_expected_sha256_fields && contains_file_size_fields) {
          status = 'ready';
          next_action = 'Manifest schema is structurally ready.';
        } else {
          status = 'incomplete';
          next_action = 'Populate missing model hashes or file sizes in manifest configuration files.';
          manifestBlockerCount++;
        }
      } catch (err) {
        status = 'unreadable';
        next_action = 'Fix manifest file JSON syntax or local read permissions.';
        manifestBlockerCount++;
      }
    } else {
      next_action = 'Create or initialize the required checksum manifest file.';
      manifestBlockerCount++;
    }

    inspectedManifests.push({
      manifest_path: relPath,
      exists,
      readable,
      contains_expected_model_entries,
      contains_expected_sha256_fields,
      contains_file_size_fields,
      manifest_presence_status: status,
      next_action
    });
  }

  // 3. Audit Audio Presence
  const inspectedFolders: InspectedFolder[] = [];
  let totalAcceptedAudioCount = 0;
  let foldersBlockerCount = 0;

  for (const folder of APPROVED_AUDIO_INPUT_DIRECTORIES) {
    const relPath = path.relative(REPO_ROOT, folder);
    let exists = false;
    let readable = false;
    let discovered_file_count = 0;
    let accepted_extension_count = 0;
    let unsupported_extension_count = 0;
    let zero_byte_file_count = 0;
    let status: InspectedFolder['audio_presence_status'] = 'missing';
    let next_action = '';

    if (fs.existsSync(folder)) {
      exists = true;
      try {
        fs.accessSync(folder, fs.constants.R_OK);
        readable = true;

        const files = fs.readdirSync(folder);
        for (const file of files) {
          if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') continue;
          
          const filePath = path.join(folder, file);
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;

          discovered_file_count++;
          const ext = path.extname(file).toLowerCase();

          if (ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
            if (stat.size === 0) {
              zero_byte_file_count++;
            } else {
              accepted_extension_count++;
            }
          } else {
            unsupported_extension_count++;
          }
        }

        totalAcceptedAudioCount += accepted_extension_count;

        if (discovered_file_count === 0) {
          status = 'empty';
          next_action = 'Stage valid audio files to unblock routes.';
        } else if (accepted_extension_count > 0) {
          status = 'active_staged';
          next_action = 'Eligible audio files staged and ready.';
        } else {
          status = 'empty';
          next_action = 'All staged files are either unsupported formats or 0-byte size.';
        }
      } catch (err) {
        status = 'unreadable';
        next_action = 'Grant read permissions to folders to allow scanning.';
        foldersBlockerCount++;
      }
    } else {
      next_action = `Approved folder /${relPath} is missing. Please create it.`;
      foldersBlockerCount++;
    }

    inspectedFolders.push({
      folder_path: relPath,
      exists,
      readable,
      discovered_file_count,
      accepted_extension_count,
      unsupported_extension_count,
      zero_byte_file_count,
      audio_presence_status: status,
      next_action
    });
  }

  // 4. Determine Overall Preflight Status
  const blockers: string[] = [];

  if (modelBlockerCount > 0) {
    blockers.push("Required Whisper model binaries are missing or unreadable in models/asr/whisper/.");
  }
  if (manifestBlockerCount > 0) {
    blockers.push("Required checksum manifest configurations are missing, incomplete, or unreadable.");
  }
  if (foldersBlockerCount > 0) {
    blockers.push("Approved audio staging directories are missing or unreadable.");
  }
  if (totalAcceptedAudioCount === 0) {
    blockers.push("No eligible local audio files staged. At least one non-empty audio file is required.");
  }

  let finalPreflightStatus: 'blocked' | 'ready_for_revalidation' = 'blocked';
  if (blockers.length === 0) {
    finalPreflightStatus = 'ready_for_revalidation';
  } else {
    finalPreflightStatus = 'blocked';
  }

  // 5. Template replacement compilation
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
  // a) Model presence profile
  let modelsTable = `| Model Filename | Expected Destination Path | Exists | Size (Bytes) | Readable | Presence Status | Required Next Action |\n`;
  modelsTable += `|---|---|---|---|---|---|---|\n`;
  inspectedModels.forEach(m => {
    modelsTable += `| \`${m.model_filename}\` | \`${m.expected_path}\` | \`${m.exists}\` | ${m.size_bytes !== null ? m.size_bytes : '-'} | \`${m.readable}\` | \`${m.presence_status}\` | ${m.next_action} |\n`;
  });
  const modelPresenceMd = loadAndReplaceTemplate('asr-model-presence-template.md', {
    MODELS_TABLE: modelsTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_presence_${dateStr}.md`), modelPresenceMd);

  // b) Checksum manifest readiness
  let manifestsTable = `| Manifest File Path | Exists | Readable | Expected Models | Has SHA256 Fields | Has Size Fields | Manifest Status | Next Action |\n`;
  manifestsTable += `|---|---|---|---|---|---|---|---|\n`;
  inspectedManifests.forEach(m => {
    manifestsTable += `| \`${m.manifest_path}\` | \`${m.exists}\` | \`${m.readable}\` | \`${m.contains_expected_model_entries}\` | \`${m.contains_expected_sha256_fields}\` | \`${m.contains_file_size_fields}\` | \`${m.manifest_presence_status}\` | ${m.next_action} |\n`;
  });
  const manifestPresenceMd = loadAndReplaceTemplate('asr-manifest-presence-template.md', {
    MANIFESTS_TABLE: manifestsTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_manifest_presence_${dateStr}.md`), manifestPresenceMd);

  // c) Audio presence profile
  let audiosTable = `| Approved Folder | Exists | Readable | Discovered Files | Accepted Extensions | Unsupported Extensions | Zero-Byte Files | Staging Status | Next Action |\n`;
  audiosTable += `|---|---|---|---|---|---|---|---|---|\n`;
  inspectedFolders.forEach(f => {
    audiosTable += `| \`${f.folder_path}\` | \`${f.exists}\` | \`${f.readable}\` | ${f.discovered_file_count} | ${f.accepted_extension_count} | ${f.unsupported_extension_count} | ${f.zero_byte_file_count} | \`${f.audio_presence_status}\` | ${f.next_action} |\n`;
  });
  const audioPresenceMd = loadAndReplaceTemplate('asr-audio-presence-template.md', {
    AUDIOS_TABLE: audiosTable.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_presence_${dateStr}.md`), audioPresenceMd);

  // d) Preflight blockers checklist
  let blockersChecklist = '';
  if (blockers.length > 0) {
    blockers.forEach((b, idx) => {
      blockersChecklist += `${idx + 1}. [ ] **Preflight Blocker:** ${b}\n`;
    });
  } else {
    blockersChecklist = `* No preflight blockers detected. Staging presence verified. Ready for Phase 11Z-G rerun validation pass.`;
  }
  const preflightBlockersMd = loadAndReplaceTemplate('asr-preflight-blockers-template.md', {
    BLOCKERS_CHECKLIST: blockersChecklist.trim()
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_preflight_blockers_${dateStr}.md`), preflightBlockersMd);

  // e) Next Actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-G: Manual Asset Revalidation Pass'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // f) Preflight summary
  const summaryMd = loadAndReplaceTemplate('asr-preflight-summary-template.md', {
    DATE: dateStr,
    PREFLIGHT_STATUS: finalPreflightStatus,
    MODELS_COUNT: String(EXPECTED_MODELS.length),
    MODELS_FOUND: String(inspectedModels.filter(m => m.exists).length),
    MODELS_MISSING: String(inspectedModels.filter(m => !m.exists).length),
    MANIFESTS_COUNT: String(inspectedManifests.filter(m => m.manifest_presence_status === 'ready').length),
    MANIFESTS_MISSING: String(inspectedManifests.filter(m => !m.exists).length),
    FOLDERS_COUNT: String(APPROVED_AUDIO_INPUT_DIRECTORIES.length),
    ACCEPTED_AUDIO_COUNT: String(totalAcceptedAudioCount),
    ZERO_BYTE_COUNT: String(inspectedFolders.reduce((acc, f) => acc + f.zero_byte_file_count, 0)),
    ASR_CALLED: 'false',
    TRANSCRIPTION_GENERATED: 'false',
    EXTERNAL_API_CALLED: '0',
    DOWNLOAD_CALLED: '0'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_preflight_summary_${dateStr}.md`), summaryMd);

  // g) Combined Master Report
  const masterReportMd = loadAndReplaceTemplate('asr-asset-preflight-report-template.md', {
    DATE: dateStr,
    PREFLIGHT_STATUS: finalPreflightStatus,
    MODEL_PRESENCE_STATUS: modelBlockerCount === 0 ? 'verified' : 'blocked',
    MANIFEST_READINESS_STATUS: manifestBlockerCount === 0 ? 'verified' : 'blocked',
    AUDIO_PRESENCE_STATUS: totalAcceptedAudioCount > 0 ? 'verified' : 'blocked',
    MODEL_PRESENCE_DETAILS: modelPresenceMd.trim(),
    MANIFEST_PRESENCE_DETAILS: manifestPresenceMd.trim(),
    AUDIO_PRESENCE_DETAILS: audioPresenceMd.trim(),
    BLOCKERS_LIST: blockers.length > 0 ? blockers.map(b => `* ⚠️ **Preflight Blocker:** ${b}`).join('\n') : '* No blockers identified.',
    ASR_CALLED: 'false',
    TRANSCRIPTION_GENERATED: 'false',
    EXTERNAL_API_CALLED: 'false',
    DOWNLOAD_CALLED: 'false',
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-G: Manual Asset Revalidation Pass'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_asset_preflight_report_${dateStr}.md`), masterReportMd);

  // 6. Generate JSON Manifest Output
  const manifestOut = {
    manifest_version: "1.0",
    audit_date: dateStr,
    preflight_status: finalPreflightStatus,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    preflight_metrics: {
      total_models_expected: EXPECTED_MODELS.length,
      models_present_count: inspectedModels.filter(m => m.exists).length,
      models_missing_count: inspectedModels.filter(m => !m.exists).length,
      manifests_inspected_count: CHECKSUM_MANIFEST_FILES.length,
      manifests_ready_count: inspectedManifests.filter(m => m.manifest_presence_status === 'ready').length,
      audio_folders_checked_count: APPROVED_AUDIO_INPUT_DIRECTORIES.length,
      accepted_audio_files_discovered: totalAcceptedAudioCount
    },
    scanned_models: inspectedModels,
    scanned_manifests: inspectedManifests,
    scanned_folders: inspectedFolders,
    blockers,
    asr_called: false,
    transcription_generated: false,
    external_api_called: false,
    download_called: false,
    next_action: finalPreflightStatus === 'ready_for_revalidation'
      ? 'ASR presence preflight completed successfully. Proceed to rerun checksum, audio staging, and join gates validation (Phase 11Z-G).'
      : 'Place missing Whisper models under models/asr/whisper/, complete manifest hash update checklist, stage non-empty audio inputs, and rerun preflight checks.'
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_asset_preflight_manifest_${dateStr}.json`),
    JSON.stringify(manifestOut, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR PRESENCE PREFLIGHT COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report: outputs/asr_asset_preflight/asr_preflight_summary_${dateStr}.md`);
  console.log(`Manifest:       outputs/asr_asset_preflight/asr_asset_preflight_manifest_${dateStr}.json`);
  console.log(`Final Status:   ${finalPreflightStatus.toUpperCase()}`);
  console.log(`Models Found:   ${inspectedModels.filter(m => m.exists).length} / ${EXPECTED_MODELS.length}`);
  console.log(`Audios Found:   ${totalAcceptedAudioCount} eligible audio files staged`);
  console.log("=========================================");

  await announceCompletion("ASR manual asset presence preflight completed successfully.", "12");
}

runPresencePreflightGate().catch((err) => {
  console.error(`❌ Preflight execution error: ${(err as Error).message}`);
  process.exit(1);
});
