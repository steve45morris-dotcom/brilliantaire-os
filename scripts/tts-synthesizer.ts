import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SYNTHESIZER_SCAFFOLD_ONLY,
  ALLOW_AUDIO_GENERATION,
  ALLOW_MODEL_DOWNLOAD,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_SHELL_EXECUTION,
  REQUIRE_VALIDATED_TTS_QUEUE,
  REQUIRE_MANUAL_ENABLE,
  REQUIRE_LOCAL_MODEL_FILE,
  engineConfig,
  voiceProfiles,
  inputFolders,
  outputFolders,
  REPO_ROOT
} from '../config/tts-synthesizer.js';
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
  const logFile = path.join(outputFolders.logs, `tts_synthesizer_log_${dateStr}.md`);
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
  filename: string;
}

function readLatestValidationReport(): ValidationReportData {
  const latestReportPath = getLatestFileInDir(inputFolders.validationReports, 'tts_validation_report');
  if (!latestReportPath) {
    return { score: '0', blockers: '- Missing validation report file', filename: 'None found' };
  }

  const text = fs.readFileSync(latestReportPath, 'utf-8');
  const scoreMatch = text.match(/Readiness Score:\*\*?\s*(\d+)%/i);
  const score = scoreMatch ? scoreMatch[1] : 'Unknown';

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

  return {
    score,
    blockers,
    filename: path.basename(latestReportPath)
  };
}

// 1. config-report command
async function handleConfigReport(): Promise<string> {
  console.log("🔬 Compiling parameter configurations report...");
  await announceIntent("Compiling TTS engine config report.");

  const validation = readLatestValidationReport();
  const latestQueuePacket = getLatestFileInDir(inputFolders.queuePackets, 'grounded_tts_queue_packet');
  const latestVoiceDirection = getLatestFileInDir(inputFolders.voiceDirections, 'grounded_tts_voice_direction');

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_audio', 'tts-engine-config-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Engine config template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const formattedDate = getFormattedDate();
  const queuePacketBasename = latestQueuePacket ? path.basename(latestQueuePacket) : 'None';
  const voiceProfileStr = latestVoiceDirection ? 'oracle voice (Calibrated Calms)' : 'default strategic narrator';

  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{ENGINE_NAME\}\}/g, engineConfig.engineName)
    .replace(/\{\{ENGINE_MODE\}\}/g, engineConfig.engineMode)
    .replace(/\{\{AUDIO_GENERATION_ENABLED\}\}/g, String(ALLOW_AUDIO_GENERATION))
    .replace(/\{\{MODEL_DOWNLOAD_ENABLED\}\}/g, String(ALLOW_MODEL_DOWNLOAD))
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, engineConfig.modelDirectory)
    .replace(/\{\{OUTPUT_DIRECTORY\}\}/g, engineConfig.outputDirectory)
    .replace(/\{\{VOICE_PROFILE\}\}/g, voiceProfileStr)
    .replace(/\{\{SOURCE_QUEUE_PACKET\}\}/g, queuePacketBasename)
    .replace(/\{\{VALIDATION_SCORE\}\}/g, validation.score)
    .replace(/\{\{BLOCKERS\}\}/g, validation.blockers)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Place Piper model ONNX files manually in models/tts/piper/ before synthesis.");

  const outPath = getSafeWritePath(outputFolders.configReports, 'tts_engine_config_report_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS engine config report generated successfully. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_CONFIG_REPORT', detailMsg);

  await announceCompletion("TTS engine config report compiled successfully.");
  return outPath;
}

// 2. model-check command
async function handleModelCheck(): Promise<string> {
  console.log("🔬 Inspecting local model directory for voice binaries...");
  await announceIntent("Inspecting local Piper model folder.");

  const dirExists = fs.existsSync(engineConfig.modelDirectory);
  let filesFound = false;
  let onnxFilesList: string[] = [];

  if (dirExists) {
    const files = fs.readdirSync(engineConfig.modelDirectory);
    onnxFilesList = files.filter(f => f.endsWith('.onnx') || f.endsWith('.json'));
    filesFound = onnxFilesList.some(f => f.endsWith('.onnx'));
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_audio', 'model-readiness-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Model readiness template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const formattedDate = getFormattedDate();
  const warningText = filesFound 
    ? "No missing model issues detected." 
    : "⚠️ Warning: No local ONNX voice files found. Download a voice model (e.g., en_US-lessac-medium.onnx) and place it in the folder.";

  const manualInstructions = "Download model files (.onnx and .onnx.json) from the official Piper repository and save them directly into models/tts/piper/. Do not run automatic scripts to retrieve them.";
  const status = filesFound ? "ready" : "pending_manual_model_placement";

  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, engineConfig.modelDirectory)
    .replace(/\{\{DIRECTORY_EXISTS\}\}/g, dirExists ? 'Yes' : 'No')
    .replace(/\{\{MODEL_FILES_FOUND\}\}/g, filesFound ? 'Yes' : 'No')
    .replace(/\{\{SUPPORTED_EXTENSIONS\}\}/g, '.onnx, .onnx.json')
    .replace(/\{\{MISSING_MODEL_WARNING\}\}/g, warningText)
    .replace(/\{\{MANUAL_INSTRUCTIONS\}\}/g, manualInstructions)
    .replace(/\{\{READINESS_STATUS\}\}/g, status);

  const outPath = getSafeWritePath(outputFolders.configReports, 'tts_model_readiness_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS model readiness checked. Status: ${status}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('MODEL_CHECK', detailMsg);

  await announceCompletion("TTS model readiness check completed successfully.");
  return outPath;
}

// Helper to check model files
function isModelReady(): boolean {
  if (!fs.existsSync(engineConfig.modelDirectory)) return false;
  const files = fs.readdirSync(engineConfig.modelDirectory);
  return files.some(f => f.endsWith('.onnx'));
}

// 3. dry-run command
async function handleDryRun(): Promise<string> {
  console.log("🔬 Simulating speech compilation dry-run offline...");
  await announceIntent("Running offline TTS synthesis dry-run.");

  const latestScript = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_long_script');
  const latestQueue = getLatestFileInDir(inputFolders.queuePackets, 'grounded_tts_queue_packet');
  const latestVoice = getLatestFileInDir(inputFolders.voiceDirections, 'grounded_tts_voice_direction');

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_audio', 'tts-dry-run-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Dry-run template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const modelReady = isModelReady();
  const validation = readLatestValidationReport();

  const scriptBasename = latestScript ? path.basename(latestScript) : 'None';
  const queueBasename = latestQueue ? path.basename(latestQueue) : 'None';
  const voiceBasename = latestVoice ? path.basename(latestVoice) : 'None';

  const previewCmd = `piper --model models/tts/piper/en_US-lessac-medium.onnx --output_file outputs/tts_audio/audio_outputs/grounded_tts_long_script.wav < ${latestScript ? 'outputs/tts_briefs/scripts/' + scriptBasename : 'scripts/script.md'}`;
  const previewOut = `outputs/tts_audio/audio_outputs/grounded_tts_long_script.wav`;

  const blockers: string[] = [];
  if (!modelReady) {
    blockers.push("- Local Piper voice ONNX model file is missing inside models/tts/piper/");
  }
  if (validation.score !== '100') {
    blockers.push(`- Queue validation is incomplete (readiness score: ${validation.score}%)`);
  }
  if (!ALLOW_AUDIO_GENERATION) {
    blockers.push("- Real audio compilation is locked under scaffold constraints (ALLOW_AUDIO_GENERATION=false)");
  }

  const blockersText = blockers.length > 0 ? blockers.join('\n') : "- None";
  const finalStatus = blockers.length === 0 ? "dry_run_simulation_passed" : "dry_run_simulation_halted_under_blockers";

  const formattedDate = getFormattedDate();
  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{SCRIPT_CHECKED\}\}/g, scriptBasename)
    .replace(/\{\{QUEUE_PACKET_CHECKED\}\}/g, queueBasename)
    .replace(/\{\{VOICE_DIRECTION_CHECKED\}\}/g, voiceBasename)
    .replace(/\{\{MODEL_READINESS\}\}/g, modelReady ? 'ready' : 'pending_model_placement')
    .replace(/\{\{AUDIO_GENERATION_ENABLED\}\}/g, String(ALLOW_AUDIO_GENERATION))
    .replace(/\{\{COMMAND_PREVIEW\}\}/g, previewCmd)
    .replace(/\{\{OUTPUT_PATH_PREVIEW\}\}/g, previewOut)
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{FINAL_STATUS\}\}/g, finalStatus);

  const outPath = getSafeWritePath(outputFolders.dryRuns, 'tts_synthesis_dry_run_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS synthesis dry-run finished. Status: ${finalStatus}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('DRY_RUN_SIMULATION', detailMsg);

  await announceCompletion("TTS synthesis dry-run simulation complete.");
  return outPath;
}

// 4. manifest command
async function handleManifest(): Promise<string> {
  console.log("🔬 Generating expected audio outputs manifest file...");
  await announceIntent("Compiling expected speech output manifest.");

  const latestScript = getLatestFileInDir(inputFolders.scripts, 'grounded_tts_long_script');

  const templatePath = path.join(REPO_ROOT, 'templates', 'tts_audio', 'audio-output-manifest-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Manifest template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const formattedDate = getFormattedDate();
  const scriptBasename = latestScript ? path.basename(latestScript) : 'grounded_tts_long_script_2026-05-31.md';

  const content = template
    .replace(/\{\{DATE\}\}/g, formattedDate)
    .replace(/\{\{AUDIO_FILENAME\}\}/g, 'grounded_tts_long_script.wav')
    .replace(/\{\{SOURCE_SCRIPT\}\}/g, scriptBasename)
    .replace(/\{\{VOICE_PROFILE\}\}/g, 'oracle voice')
    .replace(/\{\{ENGINE\}\}/g, engineConfig.engineName)
    .replace(/\{\{MODEL_FILE\}\}/g, 'en_US-lessac-medium.onnx')
    .replace(/\{\{OUTPUT_DIRECTORY\}\}/g, engineConfig.outputDirectory)
    .replace(/\{\{GENERATION_STATUS\}\}/g, 'not_started')
    .replace(/\{\{MANUAL_REVIEW_REQUIRED\}\}/g, 'true');

  const outPath = getSafeWritePath(outputFolders.audioOutputs, 'tts_audio_output_manifest_' + formattedDate, '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `TTS audio output manifest created. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_MANIFEST', detailMsg);

  await announceCompletion("TTS expected output manifest compiled successfully.");
  return outPath;
}

// 5. status command
function handleStatus() {
  console.log("=========================================");
  console.log("🎙️ OFFLINE TTS SYNTHESIZER STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const configReport = getLatestFile(outputFolders.configReports, 'tts_engine_config_report');
  const modelReadiness = getLatestFile(outputFolders.configReports, 'tts_model_readiness');
  const dryRun = getLatestFile(outputFolders.dryRuns, 'tts_synthesis_dry_run');
  const audioManifest = getLatestFile(outputFolders.audioOutputs, 'tts_audio_output_manifest');

  const modelFound = isModelReady();

  console.log(`Latest Config Report:    ${configReport}`);
  console.log(`Latest Model Readiness:  ${modelReadiness}`);
  console.log(`Latest Dry-Run Report:   ${dryRun}`);
  console.log(`Latest Audio Manifest:   ${audioManifest}`);
  console.log(`Audio Generation:        ${ALLOW_AUDIO_GENERATION ? 'Enabled' : 'Disabled (Scaffold Only)'}`);
  console.log(`Model Files Found:       ${modelFound ? 'Yes' : 'No'}`);

  if (!modelFound) {
    console.log("Recommended Action:      Manually place Piper ONNX voice files inside models/tts/piper/.");
  } else {
    console.log("Recommended Action:      Inspect validation scores, sign-off manifest, and stage dry-run.");
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
  if (!SYNTHESIZER_SCAFFOLD_ONLY) {
    console.error("❌ Safety Gate Triggered: Synthesizer is not in scaffold-only mode.");
    process.exit(1);
  }

  if (ALLOW_AUDIO_GENERATION || ALLOW_MODEL_DOWNLOAD || ALLOW_EXTERNAL_API_CALLS || ALLOW_SHELL_EXECUTION) {
    console.error("❌ Safety Gate Triggered: Compilation execution or internet connection is incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run tts-synthesizer-help' for detailed instructions.");
    } else if (command === 'config-report') {
      await handleConfigReport();
    } else if (command === 'model-check') {
      await handleModelCheck();
    } else if (command === 'dry-run') {
      await handleDryRun();
    } else if (command === 'manifest') {
      await handleManifest();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${subCommand}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ TTS synthesizer scaffold execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
