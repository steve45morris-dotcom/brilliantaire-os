import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  MODEL_GATE_ONLY,
  ALLOW_AUDIO_GENERATION,
  ALLOW_PIPER_EXECUTION,
  ALLOW_MODEL_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_MANUAL_MODEL_PLACEMENT,
  REQUIRE_MANUAL_ENABLE,
  REQUIRE_VALIDATED_TTS_QUEUE,
  MODEL_DIRECTORY,
  ALLOWED_MODEL_EXTENSIONS,
  REQUIRED_FILE_TYPES,
  MANUAL_ENABLE_FLAG_NAME,
  inputFolders,
  outputFolders,
  REPO_ROOT
} from '../config/tts-model-gate.js';
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
  const logFile = path.join(outputFolders.logs, `tts_model_gate_log_${dateStr}.md`);
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

interface ValidationReportData {
  score: string;
  blockers: string;
}

function readLatestValidationReport(): ValidationReportData {
  const latestReportPath = getLatestFileInDir(inputFolders.validationReports, 'tts_validation_report');
  if (!latestReportPath) {
    return { score: '0', blockers: '- Missing queue validation report' };
  }

  const text = fs.readFileSync(latestReportPath, 'utf-8');
  const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
  const score = scoreMatch ? scoreMatch[1] : '0';

  const blockersStartIndex = text.indexOf('## 🚫 Outstanding Blockers');
  let blockers = '- None';
  if (blockersStartIndex !== -1) {
    const rest = text.substring(blockersStartIndex);
    const nextSectionIndex = rest.indexOf('---', 30);
    const blockersList = nextSectionIndex !== -1 ? rest.substring(0, nextSectionIndex) : rest;
    blockers = blockersList.replace('## 🚫 Outstanding Blockers', '').trim();
    if (!blockers || blockers === '') {
      blockers = '- None';
    }
  }

  return { score, blockers };
}

interface ScanData {
  dirExists: boolean;
  onnxCount: number;
  jsonCount: number;
  matchingPairFound: boolean;
  suspiciousFilesFound: boolean;
  suspiciousList: string[];
  manualFlagPresent: boolean;
  readinessScore: number;
  blockers: string[];
  finalStatus: string;
}

function runScans(): ScanData {
  const dirExists = fs.existsSync(MODEL_DIRECTORY);
  let onnxCount = 0;
  let jsonCount = 0;
  let matchingPairFound = false;
  let suspiciousFilesFound = false;
  const suspiciousList: string[] = [];

  if (dirExists) {
    const files = fs.readdirSync(MODEL_DIRECTORY);
    const onnxFiles = files.filter(f => f.endsWith('.onnx'));
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    onnxCount = onnxFiles.length;
    jsonCount = jsonFiles.length;

    for (const onnx of onnxFiles) {
      const base = onnx.slice(0, -5);
      if (jsonFiles.includes(onnx + '.json') || jsonFiles.includes(base + '.json')) {
        matchingPairFound = true;
        break;
      }
    }

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') continue;
      if (!ALLOWED_MODEL_EXTENSIONS.includes(ext)) {
        suspiciousFilesFound = true;
        suspiciousList.push(file);
      }
    }
  }

  const manualFlagPresent = process.env[MANUAL_ENABLE_FLAG_NAME] === 'true';
  const validation = readLatestValidationReport();

  const blockers: string[] = [];
  if (!dirExists) blockers.push("Model directory models/tts/piper/ does not exist.");
  if (onnxCount === 0) blockers.push("No Piper voice model (.onnx) files found.");
  if (jsonCount === 0) blockers.push("No Piper config profile (.json) files found.");
  if (onnxCount > 0 && jsonCount > 0 && !matchingPairFound) blockers.push("No matching model/config file pair found.");
  if (suspiciousFilesFound) blockers.push(`Suspicious files found inside model directory: ${suspiciousList.join(', ')}`);
  if (!manualFlagPresent) blockers.push("Manual override flag TTS_AUDIO_GENERATION_ENABLED is not set to true in environment.");
  if (validation.score !== '100') blockers.push(`Queue validation is incomplete (readiness score: ${validation.score}%)`);

  let score = 100;
  if (!dirExists) score -= 30;
  if (onnxCount === 0) score -= 20;
  if (jsonCount === 0) score -= 10;
  if (onnxCount > 0 && jsonCount > 0 && !matchingPairFound) score -= 15;
  if (suspiciousFilesFound) score -= 15;
  if (!manualFlagPresent) score -= 10;
  if (validation.score !== '100') score -= 10;

  const readinessScore = Math.max(0, score);

  let finalStatus = 'ready_for_manual_synthesis_enable';
  if (blockers.length > 0) {
    if (suspiciousFilesFound) {
      finalStatus = 'blocked';
    } else if (!dirExists || onnxCount === 0 || jsonCount === 0 || !matchingPairFound) {
      finalStatus = 'missing_model_files';
    } else {
      finalStatus = 'needs_review';
    }
  }

  return {
    dirExists,
    onnxCount,
    jsonCount,
    matchingPairFound,
    suspiciousFilesFound,
    suspiciousList,
    manualFlagPresent,
    readinessScore,
    blockers,
    finalStatus
  };
}

// 1. check command
async function handleCheck(): Promise<string> {
  console.log("🔬 Inspecting local model directory and auditing files pairs...");
  await announceIntent("Inspecting TTS local voice models.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_gate', 'model-gate-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Report template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const blockersText = scan.blockers.length > 0 ? scan.blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = scan.blockers.length > 0
    ? "Resolve outstanding model gate blockers before proceeding."
    : "Proceed to offline audio compilation steps under operator supervision.";

  const formattedDate = getFormattedDate();
  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, MODEL_DIRECTORY)
    .replace(/\{\{ONNX_FILES_FOUND\}\}/g, String(scan.onnxCount))
    .replace(/\{\{CONFIG_FILES_FOUND\}\}/g, String(scan.jsonCount))
    .replace(/\{\{MATCHING_PAIR_FOUND\}\}/g, scan.matchingPairFound ? 'Yes' : 'No')
    .replace(/\{\{SUSPICIOUS_FILES\}\}/g, scan.suspiciousFilesFound ? scan.suspiciousList.join('; ') : 'No suspicious files detected')
    .replace(/\{\{MANUAL_ENABLE_FLAG\}\}/g, MANUAL_ENABLE_FLAG_NAME)
    .replace(/\{\{MANUAL_ENABLE_FLAG_STATUS\}\}/g, scan.manualFlagPresent ? 'true (Enabled)' : 'false (Disabled)')
    .replace(/\{\{QUEUE_VALIDATION_READINESS\}\}/g, scan.blockers.some(b => b.includes('Queue validation')) ? 'Incomplete' : 'Ready')
    .replace(/\{\{AUDIO_GENERATION_ELIGIBILITY\}\}/g, scan.blockers.length === 0 ? 'Eligible' : 'Ineligible')
    .replace(/\{\{READINESS_SCORE\}\}/g, String(scan.readinessScore))
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{FINAL_STATUS\}\}/g, scan.finalStatus)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reports, 'tts_model_gate_report_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model gate report generated successfully. Score: ${scan.readinessScore}%. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_GATE_REPORT', detailMsg);

  await announceCompletion("TTS model readiness report compiled successfully.");
  return outPath;
}

// 2. checklist command
async function handleChecklist(): Promise<string> {
  console.log("🔬 Compiling structured model files eligibility checklist...");
  await announceIntent("Compiling TTS model files checklist.");

  const scan = runScans();
  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_gate', 'model-file-checklist-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Checklist template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const validation = readLatestValidationReport();

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{MODEL_DIR_STATUS\}\}/g, scan.dirExists ? 'PASSED' : 'FAILED')
    .replace(/\{\{MODEL_DIR_EVIDENCE\}\}/g, scan.dirExists ? 'Directory exists' : 'Directory missing')
    .replace(/\{\{MODEL_DIR_BLOCKER\}\}/g, scan.dirExists ? 'No' : 'Yes')
    .replace(/\{\{MODEL_DIR_ACTION\}\}/g, scan.dirExists ? 'None' : 'Create models/tts/piper/ directory')

    .replace(/\{\{ONNX_STATUS\}\}/g, scan.onnxCount > 0 ? 'PASSED' : 'FAILED')
    .replace(/\{\{ONNX_EVIDENCE\}\}/g, `${scan.onnxCount} files found`)
    .replace(/\{\{ONNX_BLOCKER\}\}/g, scan.onnxCount > 0 ? 'No' : 'Yes')
    .replace(/\{\{ONNX_ACTION\}\}/g, scan.onnxCount > 0 ? 'None' : 'Place voice ONNX model files in models/tts/piper/')

    .replace(/\{\{JSON_STATUS\}\}/g, scan.jsonCount > 0 ? 'PASSED' : 'FAILED')
    .replace(/\{\{JSON_EVIDENCE\}\}/g, `${scan.jsonCount} config profiles found`)
    .replace(/\{\{JSON_BLOCKER\}\}/g, scan.jsonCount > 0 ? 'No' : 'Yes')
    .replace(/\{\{JSON_ACTION\}\}/g, scan.jsonCount > 0 ? 'None' : 'Place JSON config profiles in models/tts/piper/')

    .replace(/\{\{PAIR_STATUS\}\}/g, scan.matchingPairFound ? 'PASSED' : 'FAILED')
    .replace(/\{\{PAIR_EVIDENCE\}\}/g, scan.matchingPairFound ? 'Matching pair verified' : 'No matching voice/config pairs found')
    .replace(/\{\{PAIR_BLOCKER\}\}/g, scan.matchingPairFound ? 'No' : 'Yes')
    .replace(/\{\{PAIR_ACTION\}\}/g, scan.matchingPairFound ? 'None' : 'Verify config shares base name with ONNX file')

    .replace(/\{\{SAFETY_STATUS\}\}/g, !scan.suspiciousFilesFound ? 'PASSED' : 'WARNING')
    .replace(/\{\{SAFETY_EVIDENCE\}\}/g, !scan.suspiciousFilesFound ? 'Clean directory' : `Suspicious files: ${scan.suspiciousList.join(', ')}`)
    .replace(/\{\{SAFETY_BLOCKER\}\}/g, !scan.suspiciousFilesFound ? 'No' : 'Yes')
    .replace(/\{\{SAFETY_ACTION\}\}/g, !scan.suspiciousFilesFound ? 'None' : 'Clean model folder of extraneous scripts/executables')

    .replace(/\{\{OVERRIDE_STATUS\}\}/g, scan.manualFlagPresent ? 'PASSED' : 'FAILED')
    .replace(/\{\{OVERRIDE_EVIDENCE\}\}/g, scan.manualFlagPresent ? 'Override set to true' : 'Override variable not active')
    .replace(/\{\{OVERRIDE_BLOCKER\}\}/g, scan.manualFlagPresent ? 'No' : 'Yes')
    .replace(/\{\{OVERRIDE_ACTION\}\}/g, scan.manualFlagPresent ? 'None' : `Declare export ${MANUAL_ENABLE_FLAG_NAME}=true locally`)

    .replace(/\{\{READY_FOR_TTS\}\}/g, scan.blockers.length === 0 ? 'Yes' : 'No')
    .replace(/\{\{BLOCKERS_COUNT\}\}/g, String(scan.blockers.length));

  const outPath = getSafeWritePath(outputFolders.checklists, 'tts_model_file_checklist_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model checklist generated successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_CHECKLIST', detailMsg);

  await announceCompletion("TTS model eligibility checklist compiled successfully.");
  return outPath;
}

// 3. manual-enable command
async function handleManualEnable(): Promise<string> {
  console.log("🔬 Generating manual activation instructions report...");
  await announceIntent("Compiling TTS manual activation instructions.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_model_gate', 'manual-enable-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Manual-enable template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{ENV_VARIABLE\}\}/g, MANUAL_ENABLE_FLAG_NAME)
    .replace(/\{\{REQUIRED_VALUE\}\}/g, 'true')
    .replace(/\{\{RECHECK_COMMAND\}\}/g, 'npm run tts-model-gate -- status')
    .replace(/\{\{NEXT_ACTION\}\}/g, "Review the readiness status again and proceed only after manual operator approval.");

  const outPath = getSafeWritePath(outputFolders.checklists, 'tts_manual_enable_instructions_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS manual-enable instructions compiled successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_MANUAL_INSTRUCTIONS', detailMsg);

  await announceCompletion("TTS manual activation instructions compiled successfully.");
  return outPath;
}

// 4. status command
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE TTS MODEL READINESS GATE STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const gateReport = getLatestFile(outputFolders.reports, 'tts_model_gate_report');
  const checklist = getLatestFile(outputFolders.checklists, 'tts_model_file_checklist');
  const manualInstructions = getLatestFile(outputFolders.checklists, 'tts_manual_enable_instructions');

  const scan = runScans();

  console.log(`Latest Gate Report:      ${gateReport}`);
  console.log(`Latest Checklist:        ${checklist}`);
  console.log(`Latest Instructions:     ${manualInstructions}`);
  console.log(`Model Files Found:       ${scan.onnxCount > 0 ? 'Yes' : 'No'} (${scan.onnxCount} ONNX, ${scan.jsonCount} JSON)`);
  console.log(`Matching Pair Found:     ${scan.matchingPairFound ? 'Yes' : 'No'}`);
  console.log(`Readiness Score:         ${scan.readinessScore}%`);
  console.log(`Active Blockers:         ${scan.blockers.length}`);
  console.log(`Audio Generation Flag:   ${scan.manualFlagPresent ? 'Enabled (true)' : 'Disabled (false)'}`);

  if (scan.blockers.length > 0) {
    console.log("Recommended Action:      Inspect validation report, check matching pairs, and set env flag.");
  } else {
    console.log("Recommended Action:      Proceed to manual synthesis execution under local sandbox.");
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

  // Safety Gates Checks
  if (!MODEL_GATE_ONLY) {
    console.error("❌ Safety Gate Triggered: Model gate is not in model-gate-only mode.");
    process.exit(1);
  }

  if (ALLOW_AUDIO_GENERATION || ALLOW_PIPER_EXECUTION || ALLOW_MODEL_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Safety Gate Triggered: Synthesis compilers or external connections are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run tts-model-gate-help' for detailed instructions.");
    } else if (command === 'check') {
      await handleCheck();
    } else if (command === 'checklist') {
      await handleChecklist();
    } else if (command === 'manual-enable') {
      await handleManualEnable();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ TTS model gate execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
