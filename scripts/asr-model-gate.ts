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
  MODEL_DIRECTORY,
  ALLOWED_MODEL_EXTENSIONS,
  MANUAL_ENABLE_FLAG_NAME,
  inputFolders,
  outputFolders,
  REPO_ROOT
} from '../config/asr-model-gate.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFormattedDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSafeWritePath(dir: string, baseName: string, ext: string): string {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let targetPath = path.join(dir, `${baseName}${ext}`);
  if (fs.existsSync(targetPath)) {
    const timestampSuffix = Math.floor(Date.now() / 1000);
    targetPath = path.join(dir, `${baseName}_${timestampSuffix}${ext}`);
  }
  return targetPath;
}

function logEvent(action: string, detail: string) {
  if (!fs.existsSync(outputFolders.logs)) {
    fs.mkdirSync(outputFolders.logs, { recursive: true });
  }
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

// Check staged audio files presence
function checkStagedAudio(): boolean {
  // Option 1: check if audio files exist
  let audioFound = false;
  if (fs.existsSync(inputFolders.inputAudio)) {
    const files = fs.readdirSync(inputFolders.inputAudio);
    const audioFiles = files.filter(f => ['.wav', '.mp3', '.m4a'].includes(path.extname(f).toLowerCase()));
    if (audioFiles.length > 0) audioFound = true;
  }
  if (!audioFound && fs.existsSync(inputFolders.recordings)) {
    const files = fs.readdirSync(inputFolders.recordings);
    const audioFiles = files.filter(f => ['.wav', '.mp3', '.m4a'].includes(path.extname(f).toLowerCase()));
    if (audioFiles.length > 0) audioFound = true;
  }
  // Option 2: scan metadata json files
  if (!audioFound && fs.existsSync(inputFolders.metadata)) {
    const files = fs.readdirSync(inputFolders.metadata).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(inputFolders.metadata, f), 'utf-8'));
        if (content.status === 'staged_for_asr' || content.stagedForAsr === true) {
          audioFound = true;
          break;
        }
      } catch (err) {}
    }
  }
  return audioFound;
}

// Run scans of models directory
interface ScanData {
  dirExists: boolean;
  modelCount: number;
  modelFiles: string[];
  unexpectedCount: number;
  unexpectedList: string[];
  emptyCount: number;
  emptyList: string[];
  filesMetadata: { name: string; size: number; ext: string }[];
}

function runScans(): ScanData {
  const dirExists = fs.existsSync(MODEL_DIRECTORY);
  let modelCount = 0;
  const modelFiles: string[] = [];
  let unexpectedCount = 0;
  const unexpectedList: string[] = [];
  let emptyCount = 0;
  const emptyList: string[] = [];
  const filesMetadata: { name: string; size: number; ext: string }[] = [];

  if (dirExists) {
    const files = fs.readdirSync(MODEL_DIRECTORY);
    for (const file of files) {
      if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') continue;
      const filePath = path.join(MODEL_DIRECTORY, file);
      const stats = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      const isAllowed = ALLOWED_MODEL_EXTENSIONS.includes(ext);

      if (isAllowed) {
        modelCount++;
        modelFiles.push(file);
        filesMetadata.push({ name: file, size: stats.size, ext });
        if (stats.size === 0) {
          emptyCount++;
          emptyList.push(file);
        }
      } else {
        unexpectedCount++;
        unexpectedList.push(file);
      }
    }
  }

  return {
    dirExists,
    modelCount,
    modelFiles,
    unexpectedCount,
    unexpectedList,
    emptyCount,
    emptyList,
    filesMetadata
  };
}

// 1. guide command
async function handleGuide(): Promise<string> {
  console.log("📖 Generating manual ASR model acquisition guide...");
  await announceIntent("Generating manual ASR model acquisition guide.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-model-acquisition-guide-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Acquisition guide template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const formattedDate = getFormattedDate();
  const nextAction = "Place Whisper model binaries inside the target folder manually and run inventory verification.";
  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{TARGET_FOLDER\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{ALLOWED_FORMATS\}\}/g, ALLOWED_MODEL_EXTENSIONS.join(', '))
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.guides, 'asr_model_acquisition_guide_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `ASR model acquisition guide generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ACQUISITION_GUIDE', detailMsg);

  await announceCompletion("ASR model acquisition guide compiled successfully.");
  return outPath;
}

// 2. inventory command
async function handleInventory(): Promise<string> {
  console.log("🗃️ Scanning Whisper models folder and generating inventory...");
  await announceIntent("Scanning local ASR models inventory.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-model-inventory-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Inventory template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  let fileRows = '';
  if (scan.filesMetadata.length > 0) {
    for (const file of scan.filesMetadata) {
      fileRows += `| ${file.name} | ${file.size} | ${file.ext} | Placed |\n`;
    }
  } else {
    fileRows = '| *No files found* | 0 | - | - |\n';
  }

  const formattedDate = getFormattedDate();
  let nextAction = "Place Whisper model files in the target directory.";
  if (scan.modelCount > 0) {
    nextAction = "Verify model file cryptographic hashes using the checksum command.";
  }
  if (scan.unexpectedCount > 0) {
    nextAction = "Remove unexpected/disallowed files from models/asr/whisper/ directory immediately.";
  }

  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{DIR_EXISTS\}\}/g, scan.dirExists ? 'Yes' : 'No')
    .replace(/\{\{FILES_COUNT\}\}/g, String(scan.modelCount))
    .replace(/\{\{FILE_ROWS\}\}/g, fileRows.trim())
    .replace(/\{\{ALLOWED_EXTENSIONS\}\}/g, ALLOWED_MODEL_EXTENSIONS.join(', '))
    .replace(/\{\{UNEXPECTED_COUNT\}\}/g, String(scan.unexpectedCount))
    .replace(/\{\{UNEXPECTED_FILES\}\}/g, scan.unexpectedCount > 0 ? scan.unexpectedList.join(', ') : 'None')
    .replace(/\{\{EMPTY_COUNT\}\}/g, String(scan.emptyCount))
    .replace(/\{\{EMPTY_FILES\}\}/g, scan.emptyCount > 0 ? scan.emptyList.join(', ') : 'None')
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.inventory, 'asr_model_inventory_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `ASR model inventory generated. Found ${scan.modelCount} model files. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_INVENTORY', detailMsg);

  await announceCompletion("ASR model inventory compiled successfully.");
  return outPath;
}

// 3. checksum command
async function handleChecksum(): Promise<string> {
  console.log("🔑 Generating cryptographic file checksum report...");
  await announceIntent("Calculating ASR model file checksum hashes.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-checksum-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Checksum template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  let hashRows = '';
  let checksumStatus = 'No hashes generated';
  if (scan.modelCount > 0 && scan.dirExists) {
    checksumStatus = 'COMPLETED';
    for (const file of scan.modelFiles) {
      try {
        const filePath = path.join(MODEL_DIRECTORY, file);
        const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
        hashRows += `| ${file} | \`${hash}\` | Calculated |\n`;
      } catch (err) {
        hashRows += `| ${file} | *Error reading file* | Error |\n`;
      }
    }
  } else {
    hashRows = '| *No files checked* | - | *No hashes generated - no model files present* |\n';
  }

  const formattedDate = getFormattedDate();
  const nextAction = scan.modelCount > 0
    ? "Review calculated hashes against trusted official sources, then check readiness status."
    : "Acquire local model binaries before checksum validation can proceed.";

  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{HASH_ROWS\}\}/g, hashRows.trim())
    .replace(/\{\{CHECKSUM_STATUS\}\}/g, checksumStatus)
    .replace(/\{\{MANUAL_VERIFICATION_STATUS\}\}/g, 'Pending review by operator')
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.checksums, 'asr_model_checksum_review_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `ASR checksum report generated. Hash count: ${scan.modelCount}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_CHECKSUM', detailMsg);

  await announceCompletion("ASR checksum validation review compiled successfully.");
  return outPath;
}

// 4. readiness command
async function handleReadiness(): Promise<string> {
  console.log("🚦 Auditing ASR model gate readiness parameters...");
  await announceIntent("Evaluating ASR model readiness gate status.");

  const scan = runScans();
  const stagedAudioExists = checkStagedAudio();
  const checksumReportExists = getLatestFileInDir(outputFolders.checksums, 'asr_model_checksum_review') !== null;
  const manualFlagPresent = process.env[MANUAL_ENABLE_FLAG_NAME] !== undefined;
  const asrExecutionEnabled = process.env[MANUAL_ENABLE_FLAG_NAME] === 'true';

  // Audit blockers list
  const blockers: string[] = [];
  if (!stagedAudioExists) {
    blockers.push("No staged audio files found for transcription.");
  }
  if (!scan.dirExists) {
    blockers.push("Model directory models/asr/whisper/ does not exist.");
  }
  if (scan.dirExists && scan.modelCount === 0) {
    blockers.push("No Whisper ASR model files found in models/asr/whisper/.");
  }
  if (scan.unexpectedCount > 0) {
    blockers.push(`Suspicious or unexpected files found in model directory: ${scan.unexpectedList.join(', ')}`);
  }
  if (!checksumReportExists) {
    blockers.push("No checksum review report has been generated yet.");
  }
  if (!asrExecutionEnabled) {
    blockers.push("Manual ASR activation flag ASR_EXECUTION_ENABLED is not set to true in environment.");
  }

  // Calculate readiness score
  let score = 100;
  if (!stagedAudioExists) score -= 10;
  if (!scan.dirExists) score -= 30;
  if (scan.dirExists && scan.modelCount === 0) score -= 20;
  if (scan.unexpectedCount > 0) score -= 30;
  if (!checksumReportExists) score -= 15;
  if (!asrExecutionEnabled) score -= 15;
  const readinessScore = Math.max(0, score);

  // Final status state machine
  let finalStatus = 'blocked';
  if (scan.unexpectedCount > 0) {
    finalStatus = 'blocked';
  } else if (!scan.dirExists || scan.modelCount === 0) {
    finalStatus = 'missing_model_files';
  } else if (!checksumReportExists) {
    finalStatus = 'missing_checksum_review';
  } else if (!asrExecutionEnabled) {
    finalStatus = 'missing_enable_flag';
  } else {
    finalStatus = 'ready_for_manual_asr_enable';
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_model_gate', 'asr-readiness-gate-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Readiness gate template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const blockersText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = finalStatus === 'ready_for_manual_asr_enable'
    ? "ASR model readiness gate is fully satisfied. Safe manual transcription is permitted under operator supervision."
    : "Resolve outstanding blockers listed in this report.";

  const formattedDate = getFormattedDate();
  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{STAGED_AUDIO_FOUND\}\}/g, stagedAudioExists ? 'Yes' : 'No')
    .replace(/\{\{ASR_MODEL_FILES_FOUND\}\}/g, scan.modelCount > 0 ? 'Yes' : 'No')
    .replace(/\{\{CHECKSUM_REPORT_PRESENT\}\}/g, checksumReportExists ? 'Yes' : 'No')
    .replace(/\{\{MANUAL_ENABLE_FLAG_PRESENT\}\}/g, manualFlagPresent ? 'Yes' : 'No')
    .replace(/\{\{ASR_EXECUTION_ENABLED\}\}/g, asrExecutionEnabled ? 'Yes' : 'No')
    .replace(/\{\{READINESS_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{FINAL_STATUS\}\}/g, finalStatus)
    .replace(/\{\{BLOCKERS_LIST\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'asr_model_gate_readiness_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content, 'utf-8');

  const detailMsg = `ASR readiness gate report compiled. Readiness Score: ${readinessScore}%. Status: ${finalStatus}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_READINESS', detailMsg);

  await announceCompletion("ASR model readiness report compiled successfully.");
  return outPath;
}

// 5. status command
function handleStatus() {
  console.log("=========================================");
  console.log("🎙️ OFFLINE ASR MODEL READINESS GATE STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const guide = getLatestFile(outputFolders.guides, 'asr_model_acquisition_guide');
  const inventory = getLatestFile(outputFolders.inventory, 'asr_model_inventory');
  const checksum = getLatestFile(outputFolders.checksums, 'asr_model_checksum_review');
  const readiness = getLatestFile(outputFolders.reports, 'asr_model_gate_readiness');

  const scan = runScans();
  const stagedAudioExists = checkStagedAudio();
  const checksumReportExists = checksum !== 'None generated';
  const asrExecutionEnabled = process.env[MANUAL_ENABLE_FLAG_NAME] === 'true';

  // Audit blockers list
  const blockers: string[] = [];
  if (!stagedAudioExists) blockers.push("No staged audio files found for transcription.");
  if (!scan.dirExists) blockers.push("Model directory models/asr/whisper/ does not exist.");
  if (scan.dirExists && scan.modelCount === 0) blockers.push("No Whisper ASR model files found.");
  if (scan.unexpectedCount > 0) blockers.push("Disallowed files present inside models directory.");
  if (!checksumReportExists) blockers.push("No checksum review report generated.");
  if (!asrExecutionEnabled) blockers.push("Manual override flag ASR_EXECUTION_ENABLED is not set to true in environment.");

  let score = 100;
  if (!stagedAudioExists) score -= 10;
  if (!scan.dirExists) score -= 30;
  if (scan.dirExists && scan.modelCount === 0) score -= 20;
  if (scan.unexpectedCount > 0) score -= 30;
  if (!checksumReportExists) score -= 15;
  if (!asrExecutionEnabled) score -= 15;
  const readinessScore = Math.max(0, score);

  console.log(`Latest Acquisition Guide:  ${guide}`);
  console.log(`Latest Inventory:          ${inventory}`);
  console.log(`Latest Checksum Review:    ${checksum}`);
  console.log(`Latest Readiness Gate:     ${readiness}`);
  console.log(`Model Files Found:         ${scan.modelCount > 0 ? 'Yes' : 'No'} (${scan.modelCount} files total)`);
  console.log(`Checksum Reviewed:         ${checksumReportExists ? 'Yes' : 'No'}`);
  console.log(`ASR Execution Enabled:     ${asrExecutionEnabled ? 'Yes' : 'No'}`);
  console.log(`Readiness Score:           ${readinessScore}%`);
  console.log(`Active Blockers Count:     ${blockers.length}`);
  if (blockers.length > 0) {
    console.log("\n🚫 Current Blocker Audits:");
    blockers.forEach(b => console.log(`  - ${b}`));
    console.log("\nRecommended Action:        Ensure model binaries exist, review their checksums, stage audio, and set the env flag.");
  } else {
    console.log("\nRecommended Action:        Gate checks passed. Local transcription is fully eligible for manual enable.");
  }
  console.log("=========================================");
}

async function main() {
  const args = process.argv.slice(2);
  let command = args[0] ? args[0].toLowerCase().trim() : 'help';
  let subCommand = args[1] ? args[1].toLowerCase().trim() : '';

  if (command.includes(' ')) {
    const parts = command.split(/\s+/);
    command = parts[0];
    subCommand = parts[1] || '';
  }

  // Safety Gate Check validations
  if (!MODEL_GATE_ONLY) {
    console.error("❌ Safety Gate Triggered: Model gate is not in model-gate-only mode.");
    process.exit(1);
  }

  if (ALLOW_MODEL_DOWNLOAD || ALLOW_ASR_EXECUTION || ALLOW_AUDIO_TRANSCRIPTION || ALLOW_EXTERNAL_API_CALLS || ALLOW_SHELL_EXECUTION) {
    console.error("❌ Safety Gate Triggered: Synthesis execution, model downloads, or external connections are incorrectly enabled.");
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
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ ASR model gate execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
