import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  EXPECTED_MODEL_DIRECTORY,
  CHECKSUM_MANIFEST_FILES,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  ALLOWED_AUDIO_EXTENSIONS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY
} from '../config/asr-manual-asset-intake-checklist.js';
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

async function runIntakeChecklistGenerator() {
  console.log("🚦 Starting ASR Manual Asset Intake Checklist Generator (Phase 11Z-F)...");
  await announcePhrase("Knight standing by. Constructing manual asset intake checklists.");
  await announceIntent("Running ASR manual asset intake checklist generator.");

  const dateStr = getFormattedDate();

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  // Define static checklist specifications
  const currentASRReadinessStatus = 'blocked';
  const missingModels = ['ggml-base.en.bin', 'ggml-tiny.bin'];
  const expectedModelFolder = path.relative(REPO_ROOT, EXPECTED_MODEL_DIRECTORY);
  const manifestPaths = CHECKSUM_MANIFEST_FILES.map(f => path.relative(REPO_ROOT, f));
  const audioFolders = APPROVED_AUDIO_INPUT_DIRECTORIES.map(f => path.relative(REPO_ROOT, f));
  const acceptedFormats = ALLOWED_AUDIO_EXTENSIONS;

  // 1. Template replacement compilation helper
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
  // a) Model placement checklist
  const modelPlacementMd = loadAndReplaceTemplate('asr-model-placement-checklist-template.md', {
    EXPECTED_MODEL_DIRECTORY: `/${expectedModelFolder}`
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_placement_checklist_${dateStr}.md`), modelPlacementMd);

  // b) Checksum entry checklist
  const checksumEntryMd = loadAndReplaceTemplate('asr-checksum-entry-checklist-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_checksum_entry_checklist_${dateStr}.md`), checksumEntryMd);

  // c) Audio staging checklist
  const audioStagingMd = loadAndReplaceTemplate('asr-audio-staging-checklist-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_staging_checklist_${dateStr}.md`), audioStagingMd);

  // d) Rerun sequence
  const rerunSequenceMd = loadAndReplaceTemplate('asr-rerun-sequence-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_rerun_sequence_${dateStr}.md`), rerunSequenceMd);

  // e) Blocker resolution
  const blockerMd = loadAndReplaceTemplate('asr-blocker-resolution-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_blocker_resolution_${dateStr}.md`), blockerMd);

  // f) Safety reminder
  const safetyMd = loadAndReplaceTemplate('asr-safety-reminder-template.md', {});
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_safety_reminder_${dateStr}.md`), safetyMd);

  // g) Next actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-G: Manual Asset Revalidation Pass'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // h) Master checklist report
  const masterChecklistMd = loadAndReplaceTemplate('asr-manual-intake-checklist-template.md', {
    DATE: dateStr,
    READINESS_STATUS: currentASRReadinessStatus,
    MODEL_PLACEMENT_CHECKLIST: modelPlacementMd.trim(),
    CHECKSUM_ENTRY_CHECKLIST: checksumEntryMd.trim(),
    AUDIO_STAGING_CHECKLIST: audioStagingMd.trim(),
    BLOCKER_RESOLUTION: blockerMd.trim(),
    RERUN_SEQUENCE: rerunSequenceMd.trim(),
    SAFETY_REMINDER: safetyMd.trim(),
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-G: Manual Asset Revalidation Pass'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_manual_intake_checklist_${dateStr}.md`), masterChecklistMd);

  // 2. Generate JSON Manifest Output
  const manifestOut = {
    manifest_version: "1.0",
    audit_date: dateStr,
    gate_configuration: {
      ALLOW_ASR_EXECUTION,
      ALLOW_AUDIO_TRANSCRIPTION,
      ALLOW_EXTERNAL_API_CALLS,
      ALLOW_MODEL_DOWNLOAD
    },
    intake_specifications: {
      current_asr_readiness_status: currentASRReadinessStatus,
      missing_model_binaries: missingModels,
      expected_model_folder: `/${expectedModelFolder}`,
      required_checksum_manifest_files: manifestPaths,
      approved_audio_staging_folders: audioFolders,
      accepted_audio_formats: acceptedFormats
    },
    rerun_commands_sequence: [
      "npm run command -- \"asr-checksum-manifest-validation-gate\"",
      "npm run command -- \"asr-audio-input-staging-validation-gate\"",
      "npm run command -- \"asr-readiness-join-gate\""
    ],
    blocker_resolution_summary: [
      { blocker: "Model binaries missing", corrective_action: "Stage Whisper model files in models/asr/whisper/" },
      { blocker: "No checksum matches", corrective_action: "Update SHA256 manifest records locally" },
      { blocker: "No eligible audio files staged", corrective_action: "Add valid audio files in recordings/, inputAudio/, or outputs/asr_inputs/" },
      { blocker: "Routes blocked", corrective_action: "Complete model/audio staging and run validation gates" }
    ],
    safety_reminder: {
      asr_called: false,
      transcription_generated: false,
      external_api_called: false,
      download_called: false,
      no_file_mutations: true,
      no_manifest_auto_corrections: true
    },
    next_action: "Execute manual intake checklists, stage Whisper model files, update manifest SHA256 hashes, and trigger validation rerun sequence."
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIRECTORY, `asr_manual_intake_manifest_${dateStr}.json`),
    JSON.stringify(manifestOut, null, 2)
  );

  console.log("=========================================");
  console.log("🟢 ASR MANUAL ASSET INTAKE CHECKLIST COMPLETE");
  console.log("=========================================");
  console.log(`Checklist Report: outputs/asr_manual_intake/asr_manual_intake_checklist_${dateStr}.md`);
  console.log(`JSON Manifest:    outputs/asr_manual_intake/asr_manual_intake_manifest_${dateStr}.json`);
  console.log(`Expected State:   ${currentASRReadinessStatus.toUpperCase()}`);
  console.log(`Missing Models:   ${missingModels.join(', ')}`);
  console.log(`Audio Extensions: ${acceptedFormats.join(', ')}`);
  console.log("=========================================");

  await announceCompletion("ASR manual asset intake checklist compiled successfully.", "12");
}

runIntakeChecklistGenerator().catch((err) => {
  console.error(`❌ Checklist generator error: ${(err as Error).message}`);
  process.exit(1);
});
