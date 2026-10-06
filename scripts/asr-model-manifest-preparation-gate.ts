import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_MODEL_DOWNLOAD,
  MODEL_DIRECTORY,
  APPROVED_AUDIO_INPUT_DIRECTORIES,
  ALLOWED_AUDIO_EXTENSIONS,
  OUTPUT_DIRECTORY,
  TEMPLATE_DIRECTORY,
  MANIFEST_FILENAME,
  ROOT_MANIFEST_PATH,
  OFFICIAL_MANIFEST_PATH
} from '../config/asr-model-manifest-preparation-gate.js';
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

async function runPreparationGate() {
  console.log("🚦 Starting ASR Model Manifest Preparation Gate (Phase 11Z-B)...");
  await announcePhrase("Knight standing by. Constructing offline manifestation parameters.");
  await announceIntent("Running ASR model manifest preparation gate.");

  const dateStr = getFormattedDate();

  // 1. Ensure Directory Structures Exist
  if (!fs.existsSync(OUTPUT_DIRECTORY)) {
    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  }

  if (!fs.existsSync(MODEL_DIRECTORY)) {
    fs.mkdirSync(MODEL_DIRECTORY, { recursive: true });
  }

  // Approved Audio Input Directories & .gitkeep placement
  let audioDirsExist = true;
  for (const dir of APPROVED_AUDIO_INPUT_DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const gitkeepPath = path.join(dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
    }
  }

  // 2. Scan directories for existing assets (no downloads, no reads)
  // Models
  const modelDirFiles = fs.readdirSync(MODEL_DIRECTORY);
  const modelFiles = modelDirFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const isSupported = ['.bin', '.pt', '.onnx', '.ggml', '.tflite'].includes(ext);
    const filePath = path.join(MODEL_DIRECTORY, file);
    return isSupported && fs.statSync(filePath).isFile();
  });

  // Audio files
  let discoveredAudioCount = 0;
  for (const dir of APPROVED_AUDIO_INPUT_DIRECTORIES) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === '.DS_Store' || file === '.gitkeep' || file === 'README.md') continue;
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
          discoveredAudioCount++;
        }
      }
    }
  }

  // 3. Create or load the checksum manifest
  const manifestTemplatePath = path.join(TEMPLATE_DIRECTORY, 'asr-checksum-manifest-template.json');
  if (!fs.existsSync(manifestTemplatePath)) {
    throw new Error(`Manifest template not found: ${manifestTemplatePath}`);
  }
  const manifestRaw = fs.readFileSync(manifestTemplatePath, 'utf-8');
  
  // Ensure the manifest files are written (templated layout)
  fs.writeFileSync(ROOT_MANIFEST_PATH, manifestRaw);
  
  const officialDir = path.dirname(OFFICIAL_MANIFEST_PATH);
  if (!fs.existsSync(officialDir)) {
    fs.mkdirSync(officialDir, { recursive: true });
  }
  fs.writeFileSync(OFFICIAL_MANIFEST_PATH, manifestRaw);

  const stagedManifestJsonPath = path.join(OUTPUT_DIRECTORY, `asr_checksum_manifest_template_${dateStr}.json`);
  fs.writeFileSync(stagedManifestJsonPath, manifestRaw);

  const manifestExists = fs.existsSync(ROOT_MANIFEST_PATH) && fs.existsSync(OFFICIAL_MANIFEST_PATH);
  const placeholderCreated = fs.existsSync(stagedManifestJsonPath);

  // 4. Template Replacement Helper
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
  // a) Placement guide
  const guideMd = loadAndReplaceTemplate('asr-model-placement-guide-template.md', {
    DATE: dateStr,
    MODEL_DIRECTORY: path.relative(path.resolve(__dirname, '..'), MODEL_DIRECTORY),
    MODEL_DIR_STATUS: fs.existsSync(MODEL_DIRECTORY) ? 'PRESENT' : 'MISSING'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_model_placement_guide_${dateStr}.md`), guideMd);

  // b) Allowed models
  const allowedMd = loadAndReplaceTemplate('asr-allowed-models-template.md', {
    DATE: dateStr,
    MODEL_FILES_COUNT: String(modelFiles.length)
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_allowed_models_${dateStr}.md`), allowedMd);

  // c) Audio input readiness
  const formattedAudioDirs = APPROVED_AUDIO_INPUT_DIRECTORIES.map(
    d => `* \`${path.relative(path.resolve(__dirname, '..'), d)}\` (Staged)`
  ).join('\n');

  const audioInputMd = loadAndReplaceTemplate('asr-audio-input-readiness-template.md', {
    DATE: dateStr,
    APPROVED_AUDIO_DIRECTORIES: formattedAudioDirs,
    AUDIO_FILES_COUNT: String(discoveredAudioCount),
    AUDIO_DIRS_STATUS: 'INITIALIZED'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_audio_input_readiness_${dateStr}.md`), audioInputMd);

  // d) Manifest validation rules
  const validationMd = loadAndReplaceTemplate('asr-manifest-validation-template.md', {
    DATE: dateStr,
    MANIFEST_EXISTS: manifestExists ? 'PASS' : 'FAIL',
    MODEL_DIRECTORY_EXISTS: fs.existsSync(MODEL_DIRECTORY) ? 'PASS' : 'FAIL',
    AUDIO_INPUT_DIRECTORIES_EXIST: audioDirsExist ? 'PASS' : 'FAIL',
    PLACEHOLDER_MANIFEST_CREATED: placeholderCreated ? 'PASS' : 'FAIL',
    MODEL_FILES_COUNT: String(modelFiles.length),
    AUDIO_FILES_COUNT: String(discoveredAudioCount),
    EXECUTION_STATUS: ALLOW_ASR_EXECUTION ? 'ENABLED' : 'BLOCKED',
    ASR_CALLED: 'false',
    EXTERNAL_API_CALLED: 'false',
    DOWNLOAD_CALLED: 'false'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_manifest_validation_rules_${dateStr}.md`), validationMd);

  // e) Next actions
  const nextActionsMd = loadAndReplaceTemplate('asr-next-actions-template.md', {
    DATE: dateStr,
    NEXT_PHASE_RECOMMENDATION: 'Phase 11Z-C: ASR Checksum Manifest Validation Gate'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_next_actions_${dateStr}.md`), nextActionsMd);

  // f) Summary
  const summaryMd = loadAndReplaceTemplate('asr-preparation-summary-template.md', {
    DATE: dateStr,
    MANIFEST_STATUS: manifestExists ? 'STAGED_PLACEHOLDER' : 'ERROR',
    MODEL_DIR: path.relative(path.resolve(__dirname, '..'), MODEL_DIRECTORY),
    AUDIO_BUFFERS_STATUS: 'INITIALIZED',
    STAGED_MANIFEST_COUNT: '1'
  });
  fs.writeFileSync(path.join(OUTPUT_DIRECTORY, `asr_preparation_summary_${dateStr}.md`), summaryMd);

  console.log("=========================================");
  console.log("🟢 ASR PREPARATION COMPLETE");
  console.log("=========================================");
  console.log(`Summary Report:   outputs/asr_preparation/asr_preparation_summary_${dateStr}.md`);
  console.log(`Manifest Staged:  ${path.relative(path.resolve(__dirname, '..'), ROOT_MANIFEST_PATH)}`);
  console.log(`Model Directory:  ${path.relative(path.resolve(__dirname, '..'), MODEL_DIRECTORY)}`);
  console.log(`Audio Inputs:     Initialized ${APPROVED_AUDIO_INPUT_DIRECTORIES.length} folders`);
  console.log("=========================================");

  await announceCompletion("ASR manifest preparation gate completed successfully.", "12");
}

runPreparationGate().catch((err) => {
  console.error(`❌ Preparation execution error: ${(err as Error).message}`);
  process.exit(1);
});
