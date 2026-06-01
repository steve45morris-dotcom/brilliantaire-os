import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  MODEL_GATE_ONLY,
  ALLOW_MODEL_DOWNLOAD,
  ALLOW_ASR_EXECUTION,
  ALLOW_AUDIO_TRANSCRIPTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_SHELL_EXECUTION,
  REQUIRE_MANUAL_MODEL_PLACEMENT,
  REQUIRE_CHECKSUM_REVIEW,
  REQUIRE_MANUAL_ENABLE,
  modelDirectory,
  EXPECTED_MANUAL_ENABLE_VAR,
  ALLOWED_MODEL_EXTENSIONS,
  outputFolders,
  REPO_ROOT
} from '../config/asr-model-gate.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDirectories() {
  for (const dir of Object.values(outputFolders)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  // Ensure Whisper model directory
  const modelPath = path.join(REPO_ROOT, modelDirectory);
  if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath, { recursive: true });
  }
}

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  const dateStr = getFormattedDate();
  const logFile = path.join(outputFolders.logs, `asr_model_gate_log_${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `- [${timestamp}] **${action}**: ${detail}\n`;
  fs.appendFileSync(logFile, entry);
}

function getLatestFileInDir(dir: string, prefix: string, ext = '.md'): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(ext) && f.startsWith(prefix))
    .map(f => ({ name: f, path: path.join(dir, f), time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
    .sort((a, b) => b.time - a.time);
  return files.length > 0 ? files[0].path : null;
}

function calculateFileSHA256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// 1. guide command
async function handleGuide(): Promise<string> {
  console.log("🛠️ Generating manual ASR model placement and acquisition guide...");
  await announceIntent("Generating ASR model acquisition guide.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-model-acquisition-guide-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Guide template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{TARGET_FOLDER\}\}/g, modelDirectory)
    .replace(/\{\{ALLOWED_FORMATS\}\}/g, ALLOWED_MODEL_EXTENSIONS.join(', '))
    .replace(/\{\{RECHECK_COMMANDS\}\}/g, `npm run asr-model-gate -- "inventory"\nnpm run asr-model-gate -- "checksum"`)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Download a Whisper model file manually, place it in models/asr/whisper/, and run the inventory scan.");

  const outPath = getSafeWritePath(outputFolders.guides, 'asr_model_acquisition_guide_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR model acquisition guide generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_GUIDE', detailMsg);

  await announceCompletion("ASR model guide compiled.");
  return outPath;
}

// 2. inventory command
async function handleInventory(): Promise<string> {
  console.log("🔬 Scanning ASR models directory for local file inventory...");
  await announceIntent("Running ASR model inventory audit.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-model-inventory-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Inventory template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const modelsPath = path.join(REPO_ROOT, modelDirectory);
  const dirExists = fs.existsSync(modelsPath) ? 'Yes' : 'No';

  let filesFoundCount = 0;
  const fileNames: string[] = [];
  const fileSizes: string[] = [];
  const extensions: string[] = [];
  const unexpectedFiles: string[] = [];
  const emptyFiles: string[] = [];

  if (fs.existsSync(modelsPath)) {
    const files = fs.readdirSync(modelsPath);
    for (const file of files) {
      if (file === '.DS_Store' || file === '.gitkeep') continue;
      const fullPath = path.join(modelsPath, file);
      const stat = fs.statSync(fullPath);
      const ext = path.extname(file).toLowerCase();

      if (stat.size === 0) {
        emptyFiles.push(file);
      }

      if (ALLOWED_MODEL_EXTENSIONS.includes(ext)) {
        filesFoundCount++;
        fileNames.push(file);
        fileSizes.push(`${file} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
        if (!extensions.includes(ext)) {
          extensions.push(ext);
        }
      } else {
        unexpectedFiles.push(file);
      }
    }
  }

  const outPath = getSafeWritePath(outputFolders.inventory, 'asr_model_inventory_' + getFormattedDate(), '.md');
  const nextAction = filesFoundCount > 0
    ? "Proceed to calculate hash values and run cryptographic checksum review."
    : "Stage Whisper model files manually under models/asr/whisper/ and re-run check.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, modelDirectory)
    .replace(/\{\{FILES_FOUND\}\}/g, String(filesFoundCount))
    .replace(/\{\{FILE_NAMES\}\}/g, fileNames.length > 0 ? fileNames.join(', ') : 'None')
    .replace(/\{\{FILE_SIZES\}\}/g, fileSizes.length > 0 ? fileSizes.join(', ') : 'None')
    .replace(/\{\{EXTENSIONS\}\}/g, extensions.length > 0 ? extensions.join(', ') : 'None')
    .replace(/\{\{UNEXPECTED_FILES\}\}/g, unexpectedFiles.length > 0 ? unexpectedFiles.join(', ') : 'None')
    .replace(/\{\{EMPTY_FILES\}\}/g, emptyFiles.length > 0 ? emptyFiles.join(', ') : 'None')
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR model inventory compiled. Found ${filesFoundCount} files. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_INVENTORY', detailMsg);

  await announceCompletion("ASR model inventory compiled.");
  return outPath;
}

// 3. checksum command
async function handleChecksum(): Promise<string> {
  console.log("🔒 Calculating safe cryptographic checksum reviews...");
  await announceIntent("Running cryptographic checksum audit.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-checksum-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Checksum template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Check inventory for files
  const modelsPath = path.join(REPO_ROOT, modelDirectory);
  const files = fs.existsSync(modelsPath) 
    ? fs.readdirSync(modelsPath).filter(f => ALLOWED_MODEL_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    : [];

  let fileResult = 'None';
  let sha256Hash = 'No hashes generated';
  let checksumStatus = 'N/A';
  let manualSourceVerification = 'N/A';
  let warningText = 'No model files present to audit.';
  let nextAction = 'Staged models first before auditing checksums.';

  if (files.length > 0) {
    const file = files[0]; // audit the primary model file
    fileResult = file;
    const fullPath = path.join(modelsPath, file);
    try {
      console.log(`Hashing file: ${file}...`);
      sha256Hash = calculateFileSHA256(fullPath);
      checksumStatus = 'verified_locally';
      manualSourceVerification = 'Required (Review SHA256 against HuggingFace/Whisper repository index)';
      warningText = 'Always verify checksum hashes manually against trusted upstream registries. Never trust unknown model downloads.';
      nextAction = 'Proceed to run final readiness gate check.';
    } catch (e) {
      sha256Hash = 'ERROR_CALCULATING_HASH';
      checksumStatus = 'failed';
    }
  }

  const outPath = getSafeWritePath(outputFolders.checksums, 'asr_model_checksum_review_' + getFormattedDate(), '.md');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{FILE\}\}/g, fileResult)
    .replace(/\{\{SHA256\}\}/g, sha256Hash)
    .replace(/\{\{CHECKSUM_STATUS\}\}/g, checksumStatus)
    .replace(/\{\{MANUAL_SOURCE_VERIFICATION\}\}/g, manualSourceVerification)
    .replace(/\{\{WARNING\}\}/g, warningText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR checksum report generated. Hash: ${sha256Hash.substring(0, 10)}... Status: ${checksumStatus}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_CHECKSUM', detailMsg);

  await announceCompletion("ASR model checksum review compiled.");
  return outPath;
}

// 4. readiness command
async function handleReadiness(): Promise<string> {
  console.log("🔬 Evaluating model readiness gate criteria...");
  await announceIntent("Evaluating ASR model readiness gate status.");

  // Check audio staging state by scanning voice recordings directory
  const recordingsDir = path.join(REPO_ROOT, 'voice_sessions', 'manual_recordings');
  let stagedAudioFound = 'No';
  if (fs.existsSync(recordingsDir)) {
    const files = fs.readdirSync(recordingsDir).filter(f => f !== '.DS_Store' && f !== '.gitkeep');
    if (files.length > 0) {
      stagedAudioFound = 'Yes';
    }
  }

  // Model inventory check
  const modelsPath = path.join(REPO_ROOT, modelDirectory);
  let modelFilesFound = 'No';
  if (fs.existsSync(modelsPath)) {
    const files = fs.readdirSync(modelsPath).filter(f => ALLOWED_MODEL_EXTENSIONS.includes(path.extname(f).toLowerCase()));
    if (files.length > 0) {
      modelFilesFound = 'Yes';
    }
  }

  // Checksum report existence
  const latestChecksum = getLatestFileInDir(outputFolders.checksums, 'asr_model_checksum_review_');
  let checksumReportPresent = latestChecksum ? 'Yes' : 'No';

  // Env variable manual check
  const envVal = process.env[EXPECTED_MANUAL_ENABLE_VAR];
  const manualEnableFlag = envVal !== undefined ? 'Yes' : 'No';
  const asrExecutionEnabled = envVal === 'true' ? 'Yes' : 'No';

  let score = 0;
  const blockers: string[] = [];

  if (stagedAudioFound === 'Yes') {
    score += 20;
  } else {
    blockers.push("Staged audio recording files not found under voice_sessions/manual_recordings/.");
  }

  if (modelFilesFound === 'Yes') {
    score += 30;
  } else {
    blockers.push("Whisper ASR model files not found under models/asr/whisper/.");
  }

  if (checksumReportPresent === 'Yes') {
    score += 20;
  } else {
    blockers.push("ASR model checksum verification review report is missing.");
  }

  if (manualEnableFlag === 'Yes') {
    score += 15;
  } else {
    blockers.push("ASR_EXECUTION_ENABLED environment enable variable is missing.");
  }

  if (asrExecutionEnabled === 'Yes') {
    score += 15;
  } else {
    blockers.push("ASR_EXECUTION_ENABLED environment enable variable is not set to 'true'.");
  }

  // System constraints
  if (!ALLOW_ASR_EXECUTION) {
    blockers.push("ASR execution is blocked by safety policy configuration.");
  }

  // Final Status
  let finalStatus = 'blocked';
  if (!ALLOW_ASR_EXECUTION) {
    finalStatus = 'blocked';
  } else if (modelFilesFound === 'No') {
    finalStatus = 'missing_model_files';
  } else if (checksumReportPresent === 'No') {
    finalStatus = 'missing_checksum_review';
  } else if (manualEnableFlag === 'No' || asrExecutionEnabled === 'No') {
    finalStatus = 'missing_enable_flag';
  } else if (asrExecutionEnabled === 'No') {
    finalStatus = 'ready_for_manual_asr_enable';
  } else {
    finalStatus = 'ready';
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-readiness-gate-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Readiness gate template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const outPath = getSafeWritePath(outputFolders.reports, 'asr_model_gate_readiness_' + getFormattedDate(), '.md');
  const blockersText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = finalStatus === 'ready'
    ? "All gates satisfied. Offline Whisper transcription execution can be unlocked."
    : "Review outstanding blockers, acquire model, calculate hashes, and verify enable environment flags.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{STAGED_AUDIO\}\}/g, stagedAudioFound)
    .replace(/\{\{MODEL_FILES\}\}/g, modelFilesFound)
    .replace(/\{\{CHECKSUM_REVIEW\}\}/g, checksumReportPresent)
    .replace(/\{\{MANUAL_ENABLE_FLAG\}\}/g, manualEnableFlag)
    .replace(/\{\{ASR_EXECUTION_ENABLED\}\}/g, asrExecutionEnabled)
    .replace(/\{\{READINESS_SCORE\}\}/g, String(score))
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{FINAL_STATUS\}\}/g, finalStatus)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR model gate readiness compiled. Score: ${score}%, Status: ${finalStatus}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_READINESS_GATE', detailMsg);

  await announceCompletion("ASR model readiness gate report compiled.");
  return outPath;
}

// 5. status
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE ASR MODEL GATE STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const guide = getLatestFile(outputFolders.guides, 'asr_model_acquisition_guide_');
  const inventory = getLatestFile(outputFolders.inventory, 'asr_model_inventory_');
  const checksum = getLatestFile(outputFolders.checksums, 'asr_model_checksum_review_');
  const reports = getLatestFile(outputFolders.reports, 'asr_model_gate_readiness_');

  // Verify Whisper model directory
  const modelsPath = path.join(REPO_ROOT, modelDirectory);
  let modelFilesFound = 'No';
  let audioFilesFound = 'No';

  if (fs.existsSync(modelsPath)) {
    const files = fs.readdirSync(modelsPath).filter(f => ALLOWED_MODEL_EXTENSIONS.includes(path.extname(f).toLowerCase()));
    if (files.length > 0) {
      modelFilesFound = 'Yes';
    }
  }

  // Audio check
  const recordingsDir = path.join(REPO_ROOT, 'voice_sessions', 'manual_recordings');
  if (fs.existsSync(recordingsDir)) {
    const files = fs.readdirSync(recordingsDir).filter(f => f !== '.DS_Store' && f !== '.gitkeep');
    if (files.length > 0) {
      audioFilesFound = 'Yes';
    }
  }

  const envVal = process.env[EXPECTED_MANUAL_ENABLE_VAR];
  const asrEnabled = envVal === 'true' ? 'Yes' : 'No';

  let score = 0;
  if (audioFilesFound === 'Yes') score += 20;
  if (modelFilesFound === 'Yes') score += 30;
  if (checksum !== 'None generated') score += 20;
  if (envVal !== undefined) score += 15;
  if (asrEnabled === 'Yes') score += 15;

  console.log(`Latest Acquisition Guide: ${guide}`);
  console.log(`Latest Inventory Scan:   ${inventory}`);
  console.log(`Latest Checksum Review:   ${checksum}`);
  console.log(`Latest Readiness Report:  ${reports}`);
  console.log(`ASR Model Files Found:    ${modelFilesFound}`);
  console.log(`Checksum Reviewed:        ${checksum !== 'None generated' ? 'Yes' : 'No'}`);
  console.log(`ASR Execution Enabled:    ${asrEnabled}`);
  console.log(`Readiness Score:          ${score}%`);

  if (!ALLOW_ASR_EXECUTION) {
    console.log("Recommended Action:      ASR execution is disabled by safety policy configuration.");
  } else if (score < 100) {
    console.log("Recommended Action:      Review blockers in readiness report, place models manually, and verify environment flags.");
  } else {
    console.log("Recommended Action:      Model acquisition and validation complete. Ready to proceed with offline ASR execution.");
  }
  console.log("=========================================");
}

async function main() {
  ensureDirectories();

  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase() || 'help';

  // Safety checks
  if (!MODEL_GATE_ONLY) {
    console.error("❌ Safety Gate Triggered: ASR model gate is not in gate-only mode.");
    process.exit(1);
  }

  if (ALLOW_MODEL_DOWNLOAD || ALLOW_ASR_EXECUTION || ALLOW_AUDIO_TRANSCRIPTION || ALLOW_EXTERNAL_API_CALLS || ALLOW_SHELL_EXECUTION) {
    console.error("❌ Safety Gate Triggered: Safety policies are incorrectly configured.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run asr-model-gate-help' for detailed instructions.");
    } else if (command === 'guide') {
      await handleGuide();
    } else if (command === 'inventory') {
      await handleInventory();
    } else if (command === 'checksum') {
      await handleChecksum();
    } else if (command === 'readiness') {
      await handleReadiness();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ ASR model gate execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
