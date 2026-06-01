import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ACTIVATION_CHECK_ONLY,
  ALLOW_AUDIO_GENERATION,
  ALLOW_PIPER_EXECUTION,
  ALLOW_MODEL_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_MANUAL_MODEL_PLACEMENT,
  REQUIRE_VALIDATED_QUEUE,
  REQUIRE_MODEL_PAIR,
  REQUIRE_MANUAL_ENABLE_FLAG,
  MODEL_DIRECTORY,
  ALLOWED_MODEL_EXTENSIONS,
  MANUAL_ENABLE_FLAG_NAME,
  EXPECTED_MANUAL_ENABLE_VALUE,
  inputFolders,
  outputFolders,
  REPO_ROOT
} from '../config/tts-model-activation.js';
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
  const logFile = path.join(outputFolders.logs, `tts_model_activation_log_${dateStr}.md`);
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

interface ScanResults {
  dirExists: boolean;
  onnxFiles: string[];
  jsonFiles: string[];
  unexpectedFiles: string[];
  emptyFiles: string[];
  fileSizes: string[];
  candidateModels: string[];
  blockers: string[];
}

function performScan(): ScanResults {
  const dirExists = fs.existsSync(MODEL_DIRECTORY);
  const onnxFiles: string[] = [];
  const jsonFiles: string[] = [];
  const unexpectedFiles: string[] = [];
  const emptyFiles: string[] = [];
  const fileSizes: string[] = [];
  const candidateModels: string[] = [];
  const blockers: string[] = [];

  if (!dirExists) {
    blockers.push("Model directory models/tts/piper/ does not exist.");
    return {
      dirExists,
      onnxFiles,
      jsonFiles,
      unexpectedFiles,
      emptyFiles,
      fileSizes,
      candidateModels,
      blockers
    };
  }

  const files = fs.readdirSync(MODEL_DIRECTORY);
  for (const file of files) {
    if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') continue;
    const fullPath = path.join(MODEL_DIRECTORY, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.size === 0) {
      emptyFiles.push(file);
    }
    
    const ext = path.extname(file).toLowerCase();
    const sizeFormatted = (stat.size / (1024 * 1024)).toFixed(2) + ' MB';
    fileSizes.push(`${file} (${sizeFormatted})`);
    
    if (ext === '.onnx') {
      onnxFiles.push(file);
      candidateModels.push(path.basename(file, '.onnx'));
    } else if (ext === '.json') {
      jsonFiles.push(file);
    } else {
      unexpectedFiles.push(file);
    }
  }

  if (onnxFiles.length === 0) {
    blockers.push("No Piper voice model (.onnx) files found.");
  }
  if (jsonFiles.length === 0) {
    blockers.push("No Piper config profile (.json) files found.");
  }
  if (emptyFiles.length > 0) {
    blockers.push(`Empty or corrupt model files detected: ${emptyFiles.join(', ')}`);
  }
  if (unexpectedFiles.length > 0) {
    blockers.push(`Unexpected files detected in model folder: ${unexpectedFiles.join(', ')}`);
  }

  return {
    dirExists,
    onnxFiles,
    jsonFiles,
    unexpectedFiles,
    emptyFiles,
    fileSizes,
    candidateModels,
    blockers
  };
}

interface PairingResult {
  onnxFile: string;
  jsonFileFound: boolean;
  pairStatus: string;
  issues: string;
  nextAction: string;
}

function performPairingCheck(): { pairings: PairingResult[]; blockers: string[] } {
  const scan = performScan();
  const pairings: PairingResult[] = [];
  const blockers: string[] = [];

  if (!scan.dirExists) {
    blockers.push("Model directory does not exist, pairing check aborted.");
    return { pairings, blockers };
  }

  for (const onnx of scan.onnxFiles) {
    const base = path.basename(onnx, '.onnx');
    const matchingJson = scan.jsonFiles.find(j => j === `${base}.json` || j === `${onnx}.json`);
    if (matchingJson) {
      pairings.push({
        onnxFile: onnx,
        jsonFileFound: true,
        pairStatus: 'PASSED',
        issues: 'None',
        nextAction: 'None'
      });
    } else {
      pairings.push({
        onnxFile: onnx,
        jsonFileFound: false,
        pairStatus: 'FAILED',
        issues: 'Config JSON missing',
        nextAction: `Place config profile named ${base}.json inside models/tts/piper/`
      });
      blockers.push(`Missing config JSON profile for model ${onnx}`);
    }
  }

  if (scan.onnxFiles.length === 0) {
    blockers.push("No voice model ONNX files found to pair.");
  }

  return { pairings, blockers };
}

function parseLatestValidationReport(): { score: number; status: string } {
  const latest = getLatestFileInDir(inputFolders.validationReports, 'tts_validation_report');
  if (!latest) {
    return { score: 0, status: 'FAILED (Missing Report)' };
  }
  const text = fs.readFileSync(latest, 'utf-8');
  const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  const status = score === 100 ? 'PASSED' : `FAILED (Score: ${score}%)`;
  return { score, status };
}

function parseLatestGateReport(): { score: number; status: string } {
  const latest = getLatestFileInDir(inputFolders.gateReports, 'tts_model_gate_report');
  if (!latest) {
    return { score: 0, status: 'FAILED (Missing Report)' };
  }
  const text = fs.readFileSync(latest, 'utf-8');
  const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
  const finalStatusMatch = text.match(/Final Status:\*\*?\s*([a-zA-Z_0-9-]+)/i);
  const finalStatus = finalStatusMatch ? finalStatusMatch[1].trim() : '';
  const status = (score === 100 || finalStatus === 'ready_for_manual_synthesis_enable') ? 'PASSED' : `FAILED (Score: ${score}%)`;
  return { score, status };
}

function parseLatestPlacementReport(): { filesFound: boolean; status: string } {
  const latest = getLatestFileInDir(outputFolders.reports, 'tts_model_placement_report');
  if (!latest) {
    return { filesFound: false, status: 'FAILED (Missing Report)' };
  }
  const text = fs.readFileSync(latest, 'utf-8');
  const onnxMatch = text.match(/ONNX Files Found:\*\*?\s*(\d+)/i);
  const onnxCount = onnxMatch ? parseInt(onnxMatch[1], 10) : 0;
  
  const blockersStartIndex = text.indexOf('## 🚫 Outstanding Blockers');
  let blockersText = '';
  if (blockersStartIndex !== -1) {
    const rest = text.substring(blockersStartIndex);
    const nextSectionIndex = rest.indexOf('---', 30);
    const blockersList = nextSectionIndex !== -1 ? rest.substring(0, nextSectionIndex) : rest;
    blockersText = blockersList.replace('## 🚫 Outstanding Blockers', '').trim();
  }
  const hasBlockers = blockersText !== '' && blockersText !== '- None';
  const status = (onnxCount > 0 && !hasBlockers) ? 'PASSED' : 'FAILED';
  return { filesFound: onnxCount > 0, status };
}

function parseLatestPairingReport(): { status: string } {
  const latest = getLatestFileInDir(outputFolders.reports, 'tts_model_pairing_report');
  if (!latest) {
    return { status: 'FAILED (Missing Report)' };
  }
  const text = fs.readFileSync(latest, 'utf-8');
  if (text.includes('FAILED') || text.includes('None | No | FAILED')) {
    return { status: 'FAILED' };
  }
  return { status: 'PASSED' };
}

// 1. placement-guide
async function handlePlacementGuide(): Promise<string> {
  console.log("🛠️ Generating manual model placement guide...");
  await announceIntent("Generating TTS manual model placement guide.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_activation', 'manual-placement-guide-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Placement guide template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{TARGET_FOLDER\}\}/g, 'models/tts/piper/')
    .replace(/\{\{REQUIRED_ONNX_FILE\}\}/g, '*.onnx voice model file')
    .replace(/\{\{REQUIRED_JSON_FILE\}\}/g, '*.json config settings file')
    .replace(/\{\{RECHECK_COMMAND\}\}/g, 'npm run tts-model-activation -- status')
    .replace(/\{\{NEXT_ACTION\}\}/g, "Place model files manually and trigger scan checklist.");

  const outPath = getSafeWritePath(outputFolders.checklists, 'tts_model_manual_placement_guide_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS manual-placement guide generated successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_PLACEMENT_GUIDE', detailMsg);

  await announceCompletion("TTS manual placement instructions compiled.");
  return outPath;
}

// 2. scan
async function handleScan(): Promise<string> {
  console.log("🔬 Scanning local Piper voice models folder...");
  await announceIntent("Scanning local Piper model directory.");

  const scan = performScan();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_activation', 'model-placement-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Model placement template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const formattedDate = getFormattedDate();
  const blockersText = scan.blockers.length > 0 ? scan.blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = scan.blockers.length > 0
    ? "Resolve outstanding placement errors before continuing."
    : "Proceed to model pairing check.";

  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{ONNX_FILES_FOUND\}\}/g, String(scan.onnxFiles.length))
    .replace(/\{\{JSON_FILES_FOUND\}\}/g, String(scan.jsonFiles.length))
    .replace(/\{\{UNEXPECTED_FILES\}\}/g, scan.unexpectedFiles.length > 0 ? scan.unexpectedFiles.join('; ') : 'None')
    .replace(/\{\{EMPTY_FILES\}\}/g, scan.emptyFiles.length > 0 ? scan.emptyFiles.join('; ') : 'None')
    .replace(/\{\{FILE_SIZES\}\}/g, scan.fileSizes.length > 0 ? scan.fileSizes.join(', ') : 'No files')
    .replace(/\{\{CANDIDATE_MODELS\}\}/g, scan.candidateModels.length > 0 ? scan.candidateModels.join(', ') : 'None')
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'tts_model_placement_report_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model placement report generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_PLACEMENT_REPORT', detailMsg);

  await announceCompletion("TTS model placement scan complete.");
  return outPath;
}

// 3. pairing-check
async function handlePairingCheck(): Promise<string> {
  console.log("🔬 Running voice model to configuration file pairing audit...");
  await announceIntent("Auditing voice model ONNX and JSON pairings.");

  const { pairings, blockers } = performPairingCheck();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_activation', 'model-pairing-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Pairing template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  let matrixText = '';
  if (pairings.length > 0) {
    matrixText = pairings.map(p => 
      `| ${p.onnxFile} | ${p.jsonFileFound ? 'Yes' : 'No'} | ${p.pairStatus} | ${p.issues} | ${p.nextAction} |`
    ).join('\n');
  } else {
    matrixText = '| None | No | FAILED | No ONNX files found | Place .onnx model files |';
  }

  const nextAction = blockers.length > 0
    ? "Resolve outstanding voice/config pairing blockers."
    : "Proceed to final voice activation readiness check.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{PAIRING_MATRIX\}\}/g, matrixText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'tts_model_pairing_report_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model pairing report generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_PAIRING_REPORT', detailMsg);

  await announceCompletion("TTS model pairing check complete.");
  return outPath;
}

// 4. activation-readiness
async function handleActivationReadiness(): Promise<string> {
  console.log("⚡ Compiling multi-layer TTS synthesis activation readiness report...");
  await announceIntent("Compiling TTS synthesis activation readiness report.");

  const validation = parseLatestValidationReport();
  const gate = parseLatestGateReport();
  const placement = parseLatestPlacementReport();
  const pairing = parseLatestPairingReport();
  const manualFlag = process.env[MANUAL_ENABLE_FLAG_NAME] === 'true';

  const blockers: string[] = [];
  let score = 0;

  if (validation.status === 'PASSED') {
    score += 20;
  } else {
    blockers.push("Queue validation is incomplete or failed.");
  }

  if (gate.status === 'PASSED') {
    score += 20;
  } else {
    blockers.push("Model gate verification is incomplete or failed.");
  }

  if (placement.status === 'PASSED') {
    score += 20;
  } else {
    blockers.push("No voice models placed or placement audit failed.");
  }

  if (pairing.status === 'PASSED') {
    score += 20;
  } else {
    blockers.push("Voice models configuration pairing audit failed.");
  }

  if (manualFlag) {
    score += 20;
  } else {
    blockers.push("Manual audio generation override flag (TTS_AUDIO_GENERATION_ENABLED) is not set to true.");
  }

  let finalStatus = 'needs_review';
  if (score === 100) {
    finalStatus = 'ready_for_manual_synthesis_enable';
  } else {
    if (placement.status !== 'PASSED' || pairing.status !== 'PASSED') {
      finalStatus = 'missing_model_files';
    } else if (!manualFlag) {
      finalStatus = 'missing_enable_flag';
    } else if (score === 0) {
      finalStatus = 'blocked';
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_activation', 'activation-readiness-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Readiness template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const blockersText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = blockers.length > 0
    ? "Clear outstanding activation blockers before enabling offline speech compiler."
    : "Proceed to launch local offline audio synthesis rendering.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{QUEUE_VALIDATION\}\}/g, validation.status)
    .replace(/\{\{MODEL_GATE\}\}/g, gate.status)
    .replace(/\{\{MODEL_PLACEMENT\}\}/g, placement.status)
    .replace(/\{\{MODEL_PAIRING\}\}/g, pairing.status)
    .replace(/\{\{MANUAL_ENABLE_FLAG\}\}/g, manualFlag ? 'true (Active)' : 'false (Inactive)')
    .replace(/\{\{AUDIO_GENERATION_ALLOWED\}\}/g, score === 100 ? 'Yes' : 'No')
    .replace(/\{\{READINESS_SCORE\}\}/g, String(score))
    .replace(/\{\{FINAL_STATUS\}\}/g, finalStatus)
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'tts_activation_readiness_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS activation readiness report generated. Score: ${score}%. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_READINESS_REPORT', detailMsg);

  await announceCompletion("TTS activation readiness check complete.");
  return outPath;
}

// 5. status
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE TTS MODEL ACTIVATION STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const placementGuide = getLatestFile(outputFolders.checklists, 'tts_model_manual_placement_guide');
  const placementReport = getLatestFile(outputFolders.reports, 'tts_model_placement_report');
  const pairingReport = getLatestFile(outputFolders.reports, 'tts_model_pairing_report');
  const readinessReport = getLatestFile(outputFolders.reports, 'tts_activation_readiness');

  const scan = performScan();
  const pairing = performPairingCheck();
  const manualFlag = process.env[MANUAL_ENABLE_FLAG_NAME] === 'true';

  const validation = parseLatestValidationReport();
  const gate = parseLatestGateReport();

  let score = 0;
  const blockers: string[] = [];

  if (validation.status === 'PASSED') score += 20;
  else blockers.push("Queue validation report not 100%");
  
  if (gate.status === 'PASSED') score += 20;
  else blockers.push("Model gate report not 100%");

  if (scan.dirExists && scan.onnxFiles.length > 0 && scan.blockers.length === 0) score += 20;
  else blockers.push("Model files missing or placement scan failed");

  if (pairing.pairings.length > 0 && pairing.blockers.length === 0) score += 20;
  else blockers.push("Model files pairing check failed");

  if (manualFlag) score += 20;
  else blockers.push("Override variable not active");

  console.log(`Latest Placement Guide:  ${placementGuide}`);
  console.log(`Latest Placement Report: ${placementReport}`);
  console.log(`Latest Pairing Report:   ${pairingReport}`);
  console.log(`Latest Readiness Report: ${readinessReport}`);
  console.log(`Model Files Found:       ${scan.onnxFiles.length > 0 ? 'Yes' : 'No'} (${scan.onnxFiles.length} ONNX, ${scan.jsonFiles.length} JSON)`);
  console.log(`Matching Pair Found:     ${(scan.onnxFiles.length > 0 && pairing.blockers.length === 0) ? 'Yes' : 'No'}`);
  console.log(`Manual Enable Flag:      ${manualFlag ? 'Present (true)' : 'Absent (false)'}`);
  console.log(`Readiness Score:         ${score}%`);
  console.log(`Active Blockers Count:   ${blockers.length}`);

  if (blockers.length > 0) {
    console.log("Recommended Action:      Read placement guide, stage files manually, set env override, and recheck.");
  } else {
    console.log("Recommended Action:      Readiness score 100%. Stable for future voice synthesis rendering.");
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
  if (!ACTIVATION_CHECK_ONLY) {
    console.error("❌ Safety Gate Triggered: Activation check is not in check-only mode.");
    process.exit(1);
  }

  if (ALLOW_AUDIO_GENERATION || ALLOW_PIPER_EXECUTION || ALLOW_MODEL_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Safety Gate Triggered: Synthesis compilers or external connections are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run tts-model-activation-help' for detailed instructions.");
    } else if (command === 'placement-guide') {
      await handlePlacementGuide();
    } else if (command === 'scan') {
      await handleScan();
    } else if (command === 'pairing-check') {
      await handlePairingCheck();
    } else if (command === 'activation-readiness') {
      await handleActivationReadiness();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ TTS model activation execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
