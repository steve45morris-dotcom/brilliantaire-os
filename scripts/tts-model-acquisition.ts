import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ACQUISITION_GUIDE_ONLY,
  ALLOW_MODEL_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_AUDIO_GENERATION,
  ALLOW_PIPER_EXECUTION,
  ALLOW_ENV_WRITE,
  REQUIRE_MANUAL_MODEL_PLACEMENT,
  MODEL_DIRECTORY,
  ALLOWED_MODEL_EXTENSIONS,
  MANUAL_ENABLE_FLAG_NAME,
  inputFolders,
  outputFolders,
  REPO_ROOT
} from '../config/tts-model-acquisition.js';
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
  const logFile = path.join(outputFolders.logs, `tts_model_acquisition_log_${dateStr}.md`);
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

interface ScanData {
  dirExists: boolean;
  onnxFiles: string[];
  jsonFiles: string[];
  unexpectedFiles: string[];
  fileSizes: string[];
  candidatePairs: string[];
  missingRequirements: string[];
  blockers: string[];
}

function performScan(): ScanData {
  const dirExists = fs.existsSync(MODEL_DIRECTORY);
  const onnxFiles: string[] = [];
  const jsonFiles: string[] = [];
  const unexpectedFiles: string[] = [];
  const fileSizes: string[] = [];
  const candidatePairs: string[] = [];
  const missingRequirements: string[] = [];
  const blockers: string[] = [];

  if (!dirExists) {
    blockers.push("Model directory models/tts/piper/ does not exist.");
    missingRequirements.push("Create target directory at models/tts/piper/.");
    return {
      dirExists,
      onnxFiles,
      jsonFiles,
      unexpectedFiles,
      fileSizes,
      candidatePairs,
      missingRequirements,
      blockers
    };
  }

  const files = fs.readdirSync(MODEL_DIRECTORY);
  for (const file of files) {
    if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') continue;
    const fullPath = path.join(MODEL_DIRECTORY, file);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(file).toLowerCase();
    const sizeFormatted = (stat.size / (1024 * 1024)).toFixed(2) + ' MB';
    fileSizes.push(`${file} (${sizeFormatted})`);

    if (ext === '.onnx') {
      onnxFiles.push(file);
    } else if (ext === '.json') {
      jsonFiles.push(file);
    } else {
      unexpectedFiles.push(file);
    }
  }

  for (const onnx of onnxFiles) {
    const base = path.basename(onnx, '.onnx');
    const matchedJson = jsonFiles.find(j => j === `${base}.json` || j === `${onnx}.json`);
    if (matchedJson) {
      candidatePairs.push(`${onnx} + ${matchedJson}`);
    } else {
      missingRequirements.push(`Missing config JSON profile file for model "${onnx}".`);
      blockers.push(`Unpaired model: "${onnx}" lacks config.`);
    }
  }

  if (onnxFiles.length === 0) {
    blockers.push("No ONNX model files found in models/tts/piper/.");
    missingRequirements.push("Place at least one valid Piper voice .onnx file in models/tts/piper/.");
  }
  if (jsonFiles.length === 0) {
    blockers.push("No configuration JSON files found in models/tts/piper/.");
    missingRequirements.push("Place matching configuration .json file in models/tts/piper/.");
  }

  return {
    dirExists,
    onnxFiles,
    jsonFiles,
    unexpectedFiles,
    fileSizes,
    candidatePairs,
    missingRequirements,
    blockers
  };
}

// 1. guide command
async function handleGuide(): Promise<string> {
  console.log("🛠️ Compiling model manual acquisition instructions guide...");
  await announceIntent("Generating TTS manual model acquisition guide.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_acquisition', 'model-acquisition-guide-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Guide template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const recheckCommands = [
    'npm run command -- "tts-model-acquisition inventory"',
    'npm run command -- "tts-model-acquisition verify-placement"',
    'npm run command -- "tts-model-activation scan"',
    'npm run command -- "tts-model-gate check"'
  ].join('\n');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{TARGET_FOLDER\}\}/g, 'models/tts/piper/')
    .replace(/\{\{REQUIRED_ONNX\}\}/g, 'en_US-lessac-low.onnx')
    .replace(/\{\{REQUIRED_JSON\}\}/g, 'en_US-lessac-low.json')
    .replace(/\{\{RECHECK_COMMANDS\}\}/g, recheckCommands)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Acquire voice files manually and place them in the target directory.");

  const outPath = getSafeWritePath(outputFolders.guides, 'tts_model_acquisition_guide_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS manual-acquisition guide generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ACQUISITION_GUIDE', detailMsg);

  await announceCompletion("TTS manual acquisition instructions compiled.");
  return outPath;
}

// 2. inventory command
async function handleInventory(): Promise<string> {
  console.log("🔬 Scanning local models directory for inventory list...");
  await announceIntent("Scanning local models folder for inventory list.");

  const scan = performScan();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_acquisition', 'model-inventory-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Inventory template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const missingText = scan.missingRequirements.length > 0
    ? scan.missingRequirements.map(m => `- ${m}`).join('\n')
    : "- None";

  const nextAction = scan.blockers.length > 0
    ? "Place missing ONNX or JSON configs and verify pairings."
    : "Proceed to run the placement verification report.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{ONNX_FILES\}\}/g, scan.onnxFiles.length > 0 ? scan.onnxFiles.join(', ') : 'None')
    .replace(/\{\{JSON_FILES\}\}/g, scan.jsonFiles.length > 0 ? scan.jsonFiles.join(', ') : 'None')
    .replace(/\{\{FILE_SIZES\}\}/g, scan.fileSizes.length > 0 ? scan.fileSizes.join(', ') : 'No files')
    .replace(/\{\{CANDIDATE_PAIRS\}\}/g, scan.candidatePairs.length > 0 ? scan.candidatePairs.join('; ') : 'None')
    .replace(/\{\{UNEXPECTED_FILES\}\}/g, scan.unexpectedFiles.length > 0 ? scan.unexpectedFiles.join(', ') : 'None')
    .replace(/\{\{MISSING_REQUIREMENTS\}\}/g, missingText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.inventory, 'tts_model_inventory_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model inventory report generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_INVENTORY', detailMsg);

  await announceCompletion("TTS model inventory scan complete.");
  return outPath;
}

// 3. verify-placement command
async function handleVerifyPlacement(): Promise<string> {
  console.log("🔬 Auditing model folder placements and configs compatibility...");
  await announceIntent("Verifying voice model folder placements.");

  const scan = performScan();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_acquisition', 'model-placement-verification-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Placement verification template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const onnxPresent = scan.onnxFiles.length > 0;
  const jsonPresent = scan.jsonFiles.length > 0;
  const matchingPair = scan.candidatePairs.length > 0;
  
  let namingCompat = 'N/A';
  if (onnxPresent && jsonPresent) {
    namingCompat = matchingPair ? 'COMPATIBLE' : 'INCOMPATIBLE';
  }

  const readyForGate = (scan.dirExists && matchingPair && scan.blockers.length === 0) ? 'Yes' : 'No';
  const blockersText = scan.blockers.length > 0 ? scan.blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = readyForGate === 'Yes'
    ? "Proceed to rerun the main model gate check script."
    : "Address missing files or config pairing mismatches.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{DIRECTORY_EXISTS\}\}/g, scan.dirExists ? 'Yes' : 'No')
    .replace(/\{\{ONNX_PRESENT\}\}/g, onnxPresent ? 'Yes' : 'No')
    .replace(/\{\{JSON_PRESENT\}\}/g, jsonPresent ? 'Yes' : 'No')
    .replace(/\{\{MATCHING_PAIR_PRESENT\}\}/g, matchingPair ? 'Yes' : 'No')
    .replace(/\{\{NAMING_COMPATIBILITY\}\}/g, namingCompat)
    .replace(/\{\{READY_FOR_GATE_RECHECK\}\}/g, readyForGate)
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'tts_model_placement_verification_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model placement verification report generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_PLACEMENT_VERIFICATION', detailMsg);

  await announceCompletion("TTS model placement verification complete.");
  return outPath;
}

// 4. next-step command
async function handleNextStep(): Promise<string> {
  console.log("🔬 Compiling next-step roadmap and active blockers...");
  await announceIntent("Compiling next steps roadmap.");

  // Read latest reports
  const latestActivationReport = getLatestFileInDir(inputFolders.activationReports, 'tts_activation_readiness');
  const latestGateReport = getLatestFileInDir(inputFolders.gateReports, 'tts_model_gate_report');
  const latestVerificationReport = getLatestFileInDir(outputFolders.reports, 'tts_model_placement_verification');

  let readinessScore = 0;
  if (latestActivationReport) {
    const text = fs.readFileSync(latestActivationReport, 'utf-8');
    const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
    if (scoreMatch) readinessScore = parseInt(scoreMatch[1], 10);
  } else if (latestGateReport) {
    const text = fs.readFileSync(latestGateReport, 'utf-8');
    const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
    if (scoreMatch) readinessScore = parseInt(scoreMatch[1], 10);
  }

  const scan = performScan();
  const missingFilesText = scan.missingRequirements.length > 0 
    ? scan.missingRequirements.map(m => `- ${m}`).join('\n') 
    : "- None";

  const manualActions: string[] = [];
  if (!scan.dirExists) {
    manualActions.push("- Create models folder structure: models/tts/piper/");
  }
  if (scan.onnxFiles.length === 0 || scan.jsonFiles.length === 0) {
    manualActions.push("- Manually acquire and download Piper voice ONNX + matching config JSON.");
    manualActions.push("- Copy acquired speech files into models/tts/piper/.");
  }
  if (scan.onnxFiles.length > 0 && scan.jsonFiles.length > 0 && scan.candidatePairs.length === 0) {
    manualActions.push("- Rename json config file to match the base prefix name of the voice ONNX model.");
  }
  
  // Also check env override variable
  const manualFlag = process.env.TTS_AUDIO_GENERATION_ENABLED === 'true';
  if (!manualFlag) {
    manualActions.push("- Export environment override flag: export TTS_AUDIO_GENERATION_ENABLED=true");
  }

  const manualActionsText = manualActions.length > 0 ? manualActions.join('\n') : "- None (Readiness is fully cleared)";
  
  const recheckCommands = [
    'npm run command -- "tts-model-activation scan"',
    'npm run command -- "tts-model-activation pairing-check"',
    'npm run command -- "tts-model-activation activation-readiness"'
  ].join('\n');

  const synthesisBlocked = readinessScore === 100 ? 'No' : 'Yes (Readiness score is under 100%)';
  const recommendedPhase = readinessScore === 100 
    ? 'Phase 11W: Local Offline Speech Synthesis execution compilation' 
    : 'Phase 11T/11U: Placement audit gate clearance and manual activation staging';

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_acquisition', 'next-step-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Next step template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{CURRENT_READINESS_SCORE\}\}/g, String(readinessScore))
    .replace(/\{\{SYNTHESIS_BLOCKED\}\}/g, synthesisBlocked)
    .replace(/\{\{MISSING_FILES\}\}/g, missingFilesText)
    .replace(/\{\{REQUIRED_MANUAL_ACTIONS\}\}/g, manualActionsText)
    .replace(/\{\{RECHECK_COMMAND\}\}/g, 'npm run tts-model-acquisition -- status')
    .replace(/\{\{RECHECK_COMMANDS\}\}/g, recheckCommands)
    .replace(/\{\{RECOMMENDED_PHASE\}\}/g, recommendedPhase);

  const outPath = getSafeWritePath(outputFolders.reports, 'tts_model_next_step_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS next-step report generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_NEXT_STEP', detailMsg);

  await announceCompletion("TTS next-step roadmap compiled.");
  return outPath;
}

// 5. status
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE TTS MODEL ACQUISITION STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const guideFile = getLatestFile(outputFolders.guides, 'tts_model_acquisition_guide');
  const inventoryFile = getLatestFile(outputFolders.inventory, 'tts_model_inventory');
  const verificationFile = getLatestFile(outputFolders.reports, 'tts_model_placement_verification');
  const nextStepFile = getLatestFile(outputFolders.reports, 'tts_model_next_step');

  const scan = performScan();
  
  // Read latest readiness score
  const latestActivationReport = getLatestFileInDir(inputFolders.activationReports, 'tts_activation_readiness');
  let score = 0;
  if (latestActivationReport) {
    const text = fs.readFileSync(latestActivationReport, 'utf-8');
    const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
    if (scoreMatch) score = parseInt(scoreMatch[1], 10);
  }

  const synthesisBlocked = score === 100 ? 'No' : 'Yes';

  console.log(`Latest Acquisition Guide: ${guideFile}`);
  console.log(`Latest Inventory Scan:    ${inventoryFile}`);
  console.log(`Latest Verification:      ${verificationFile}`);
  console.log(`Latest Next Step Report:  ${nextStepFile}`);
  console.log(`Model Files Found:        ${scan.onnxFiles.length > 0 ? 'Yes' : 'No'} (${scan.onnxFiles.length} ONNX, ${scan.jsonFiles.length} JSON)`);
  console.log(`Matching Pair Found:      ${scan.candidatePairs.length > 0 ? 'Yes' : 'No'}`);
  console.log(`Readiness Score:          ${score}%`);
  console.log(`Synthesis Blocked:        ${synthesisBlocked}`);

  if (score < 100) {
    console.log("Recommended Action:       Acquire model files manually per instructions and set override flag.");
  } else {
    console.log("Recommended Action:       Staging cleared. Ready for next synthesis rendering phase.");
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

  // Safety Gate Checks
  if (!ACQUISITION_GUIDE_ONLY) {
    console.error("❌ Safety Gate Triggered: Acquisition check is not in guide-only mode.");
    process.exit(1);
  }

  if (ALLOW_MODEL_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS || ALLOW_AUDIO_GENERATION || ALLOW_PIPER_EXECUTION || ALLOW_ENV_WRITE) {
    console.error("❌ Safety Gate Triggered: Synthesis compilers, downloads or environment writes are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run tts-model-acquisition-help' for detailed instructions.");
    } else if (command === 'guide') {
      await handleGuide();
    } else if (command === 'inventory') {
      await handleInventory();
    } else if (command === 'verify-placement') {
      await handleVerifyPlacement();
    } else if (command === 'next-step') {
      await handleNextStep();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ TTS model acquisition execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
