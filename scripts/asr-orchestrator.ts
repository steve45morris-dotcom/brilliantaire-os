import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ASR_ORCHESTRATION_ONLY,
  ALLOW_ASR_EXECUTION,
  ALLOW_EXTERNAL_API_CALLS,
  ALLOW_AUDIO_UPLOAD,
  ALLOW_SHELL_EXECUTION,
  REQUIRE_MANUAL_ENABLE,
  REQUIRE_STAGED_AUDIO,
  REQUIRE_LOCAL_ASR_MODEL,
  engineName,
  engineMode,
  modelDirectory,
  stagedAudioDirectory,
  transcriptionStagingDirectory,
  ALLOWED_AUDIO_EXTENSIONS,
  MAX_AUDIO_FILE_SIZE_BYTES,
  EXPECTED_MANUAL_ENABLE_VAR,
  outputFolders,
  REPO_ROOT
} from '../config/asr-orchestrator.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDirectories() {
  // Ensure outputs folders
  for (const dir of Object.values(outputFolders)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  // Ensure voice session recordings folder
  const recordingsDir = path.join(REPO_ROOT, stagedAudioDirectory);
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
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
  const logFile = path.join(outputFolders.logs, `asr_orchestrator_log_${dateStr}.md`);
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

// 1. readiness command
async function handleReadiness(): Promise<string> {
  console.log("🔬 Evaluating ASR local system readiness...");
  await announceIntent("Checking ASR orchestrator readiness status.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_orchestrator', 'asr-readiness-report-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Readiness template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Verify staged audio folder for valid audio files
  const recordingsDir = path.join(REPO_ROOT, stagedAudioDirectory);
  const audioFiles = fs.existsSync(recordingsDir) ? fs.readdirSync(recordingsDir) : [];
  let stagedAudioFound = 'No';
  let audioFormatValid = 'N/A';
  let audioSizeValid = 'N/A';
  let validAudioPath = '';
  let validAudioFile = '';

  const matchingAudio = audioFiles.find(f => {
    const ext = path.extname(f).toLowerCase();
    return ALLOWED_AUDIO_EXTENSIONS.includes(ext);
  });

  if (matchingAudio) {
    stagedAudioFound = 'Yes';
    validAudioFile = matchingAudio;
    validAudioPath = path.join(recordingsDir, matchingAudio);
    const stat = fs.statSync(validAudioPath);
    const ext = path.extname(matchingAudio).toLowerCase();
    
    if (ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      audioFormatValid = 'Yes';
    } else {
      audioFormatValid = 'No';
    }

    if (stat.size <= MAX_AUDIO_FILE_SIZE_BYTES) {
      audioSizeValid = 'Yes';
    } else {
      audioSizeValid = 'No';
    }
  }

  // Model validation
  const modelsDir = path.join(REPO_ROOT, modelDirectory);
  const modelDirExists = fs.existsSync(modelsDir) ? 'Yes' : 'No';
  let modelFilesFound = 'No';
  if (fs.existsSync(modelsDir)) {
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.bin') || f.endsWith('.onnx'));
    if (modelFiles.length > 0) {
      modelFilesFound = `Yes (${modelFiles.join(', ')})`;
    }
  }

  // Env check
  const envVal = process.env[EXPECTED_MANUAL_ENABLE_VAR];
  const manualEnableFlag = envVal !== undefined ? 'Yes' : 'No';
  const asrExecutionEnabled = envVal === 'true' ? 'Yes' : 'No';

  // Calculate score
  let score = 0;
  const blockers: string[] = [];

  if (stagedAudioFound === 'Yes' && audioFormatValid === 'Yes' && audioSizeValid === 'Yes') {
    score += 30;
  } else {
    blockers.push("Missing or invalid staged audio file in manual recordings directory.");
  }

  if (modelDirExists === 'Yes') {
    score += 20;
  } else {
    blockers.push("ASR Whisper model directory does not exist.");
  }

  if (modelFilesFound !== 'No') {
    score += 20;
  } else {
    blockers.push("Whisper model binary files (.bin or .onnx) not found in model directory.");
  }

  if (manualEnableFlag === 'Yes') {
    score += 15;
  } else {
    blockers.push("ASR_EXECUTION_ENABLED manual enable variable is not defined.");
  }

  if (asrExecutionEnabled === 'Yes') {
    score += 15;
  } else {
    blockers.push("ASR_EXECUTION_ENABLED manual enable variable is not set to 'true'.");
  }

  // Safety override blocker
  if (!ALLOW_ASR_EXECUTION) {
    blockers.push("ASR execution is disabled by system policy (ALLOW_ASR_EXECUTION = false).");
  }

  // Final Status
  let finalStatus = 'blocked';
  if (!ALLOW_ASR_EXECUTION) {
    finalStatus = 'blocked';
  } else if (stagedAudioFound === 'No') {
    finalStatus = 'missing_audio';
  } else if (modelFilesFound === 'No') {
    finalStatus = 'missing_asr_model';
  } else if (manualEnableFlag === 'No') {
    finalStatus = 'missing_enable_flag';
  } else if (asrExecutionEnabled === 'No') {
    finalStatus = 'ready_for_manual_asr_enable';
  } else {
    finalStatus = 'ready';
  }

  const blockersText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = finalStatus === 'ready' 
    ? "Proceed to create ASR job packet and execute dry-run simulation."
    : "Review blockers list, place Whisper model files or stage manual audio drops, and re-run readiness audit.";

  const content = template
    .replace(/\{\{REPORT_DATE\}\}/g, getFormattedDate())
    .replace(/\{\{STAGED_AUDIO_FOUND\}\}/g, stagedAudioFound)
    .replace(/\{\{AUDIO_FORMAT_VALID\}\}/g, audioFormatValid)
    .replace(/\{\{AUDIO_SIZE_VALID\}\}/g, audioSizeValid)
    .replace(/\{\{ASR_MODEL_DIRECTORY\}\}/g, modelDirectory)
    .replace(/\{\{ASR_MODEL_FILES_FOUND\}\}/g, modelFilesFound)
    .replace(/\{\{MANUAL_ENABLE_FLAG\}\}/g, EXPECTED_MANUAL_ENABLE_VAR)
    .replace(/\{\{ASR_EXECUTION_ENABLED\}\}/g, asrExecutionEnabled)
    .replace(/\{\{READINESS_SCORE\}\}/g, String(score))
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{FINAL_STATUS\}\}/g, finalStatus)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.readinessReports, 'asr_readiness_report_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR readiness audit compiled. Score: ${score}%, Status: ${finalStatus}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_READINESS', detailMsg);

  await announceCompletion("ASR readiness report compiled.");
  return outPath;
}

// 2. create-job command
async function handleCreateJob(): Promise<string> {
  console.log("📦 Initializing new ASR job packet...");
  await announceIntent("Creating ASR job packet.");

  // Scan voice sessions metadata directory for the latest session metadata
  const voiceMetadataDir = path.join(REPO_ROOT, 'voice_sessions', 'session_metadata');
  const latestSessionMeta = getLatestFileInDir(voiceMetadataDir, 'voice_session_');
  
  let sourceSessionMetadata = 'None found';
  let sourceAudio = 'None found';
  let cleanId = `asr_job_${getFormattedDate()}`;

  if (latestSessionMeta) {
    sourceSessionMetadata = `voice_sessions/session_metadata/${path.basename(latestSessionMeta)}`;
    const baseName = path.basename(latestSessionMeta, '.md');
    cleanId = `asr_job_${baseName.replace('voice_session_', '')}`;
    
    // Look for matching audio in voice_sessions/manual_recordings/
    const recordingsDir = path.join(REPO_ROOT, stagedAudioDirectory);
    if (fs.existsSync(recordingsDir)) {
      const files = fs.readdirSync(recordingsDir);
      const matched = files.find(f => path.basename(f, path.extname(f)) === baseName);
      if (matched) {
        sourceAudio = `voice_sessions/manual_recordings/${matched}`;
      }
    }
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_orchestrator', 'asr-job-packet-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Job packet template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const outPath = getSafeWritePath(outputFolders.jobPackets, `asr_job_packet_${getFormattedDate()}`, '.md');
  const jobPacketId = path.basename(outPath, '.md');

  const expectedTranscriptOutput = `outputs/asr_orchestrator/transcript_staging/${jobPacketId}_transcript.md`;
  const envVal = process.env[EXPECTED_MANUAL_ENABLE_VAR];
  const asrExecutionEnabled = envVal === 'true' ? 'true' : 'false';

  const content = template
    .replace(/\{\{JOB_PACKET_ID\}\}/g, jobPacketId)
    .replace(/\{\{SOURCE_AUDIO\}\}/g, sourceAudio)
    .replace(/\{\{SOURCE_SESSION_METADATA\}\}/g, sourceSessionMetadata)
    .replace(/\{\{ASR_ENGINE\}\}/g, `${engineName} (${engineMode})`)
    .replace(/\{\{MODEL_DIRECTORY\}\}/g, modelDirectory)
    .replace(/\{\{EXPECTED_TRANSCRIPT_OUTPUT\}\}/g, expectedTranscriptOutput)
    .replace(/\{\{EXECUTION_STATUS\}\}/g, 'not_started')
    .replace(/\{\{MANUAL_REVIEW_REQUIRED\}\}/g, 'true')
    .replace(/\{\{ASR_EXECUTION_ENABLED\}\}/g, asrExecutionEnabled);

  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR job packet initialized. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CREATE_ASR_JOB_PACKET', detailMsg);

  await announceCompletion("ASR job packet created.");
  return outPath;
}

// 3. dry-run command
async function handleDryRun(): Promise<string> {
  console.log("🔬 Simulating ASR execution via dry-run audit...");
  await announceIntent("Executing ASR dry-run simulation.");

  // Get latest job packet
  const latestJobPacket = getLatestFileInDir(outputFolders.jobPackets, 'asr_job_packet_');
  if (!latestJobPacket) {
    throw new Error("No ASR job packets found. Run create-job first.");
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_orchestrator', 'asr-dry-run-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Dry run template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Parse job packet for audio file
  const jobText = fs.readFileSync(latestJobPacket, 'utf-8');
  const audioMatch = jobText.match(/Source Audio:\*\*?\s*`?([a-zA-Z_0-9\.\/-]+)`?/i);
  const audioPathRel = audioMatch ? audioMatch[1].trim() : '';
  const fullAudioPath = path.join(REPO_ROOT, audioPathRel);
  
  let audioFileChecked = 'No';
  if (audioPathRel && fs.existsSync(fullAudioPath)) {
    audioFileChecked = `Yes (${audioPathRel})`;
  }

  // Model check
  const modelsDir = path.join(REPO_ROOT, modelDirectory);
  let modelReadiness = 'No models found in models/asr/whisper/';
  if (fs.existsSync(modelsDir)) {
    const models = fs.readdirSync(modelsDir).filter(f => f.endsWith('.bin') || f.endsWith('.onnx'));
    if (models.length > 0) {
      modelReadiness = `Passed. Found model: ${models[0]}`;
    }
  }

  const blockers: string[] = [];
  if (audioFileChecked === 'No') {
    blockers.push(`Staged audio file "${audioPathRel}" not found.`);
  }
  if (modelReadiness.startsWith('No models')) {
    blockers.push("ASR model file is missing under models/asr/whisper/.");
  }
  if (!ALLOW_ASR_EXECUTION) {
    blockers.push("ASR execution is blocked by safety policy configuration.");
  }

  const blockersText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const simulatedCmd = `whisper --model ${modelDirectory}ggml-base.bin --language en --output-txt ${outputFolders.transcriptStaging} [REDACTED]`;

  const outPath = getSafeWritePath(outputFolders.dryRuns, 'asr_dry_run_' + getFormattedDate(), '.md');
  const nextAction = blockers.length === 0
    ? "Dry-run simulation passed. Staging ASR transcript records."
    : "Resolve outstanding blockers before staging transcripts.";

  const content = template
    .replace(/\{\{DRY_RUN_DATE\}\}/g, getFormattedDate())
    .replace(/\{\{JOB_PACKET_CHECKED\}\}/g, path.basename(latestJobPacket))
    .replace(/\{\{AUDIO_FILE_CHECKED\}\}/g, audioFileChecked)
    .replace(/\{\{MODEL_READINESS\}\}/g, modelReadiness)
    .replace(/\{\{SIMULATED_COMMAND_PREVIEW\}\}/g, simulatedCmd)
    .replace(/\{\{ACTUAL_ASR_EXECUTION\}\}/g, 'false')
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR dry-run simulation compiled. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_DRY_RUN', detailMsg);

  await announceCompletion("ASR dry-run completed.");
  return outPath;
}

// 4. stage-transcript command
async function handleStageTranscript(): Promise<string> {
  console.log("📋 Staging placeholder transcripts...");
  await announceIntent("Staging ASR transcript records.");

  // Inspect latest dry run
  const latestDryRun = getLatestFileInDir(outputFolders.dryRuns, 'asr_dry_run_');
  if (!latestDryRun) {
    throw new Error("No ASR dry run report found. Run dry-run first.");
  }

  const dryRunText = fs.readFileSync(latestDryRun, 'utf-8');
  const jobMatch = dryRunText.match(/Job Packet Checked:\*\*?\s*`?([a-zA-Z_0-9\.\/-]+)`?/i);
  const jobPacketFilename = jobMatch ? jobMatch[1].trim() : '';

  if (!jobPacketFilename) {
    throw new Error("Could not extract Job Packet filename from dry run report.");
  }

  const jobPacketPath = path.join(outputFolders.jobPackets, jobPacketFilename);
  if (!fs.existsSync(jobPacketPath)) {
    throw new Error(`Job packet file not found: ${jobPacketPath}`);
  }

  const jobText = fs.readFileSync(jobPacketPath, 'utf-8');
  const audioMatch = jobText.match(/Source Audio:\*\*?\s*`?([a-zA-Z_0-9\.\/-]+)`?/i);
  const audioPathRel = audioMatch ? audioMatch[1].trim() : 'None';

  const templatePath = path.join(REPO_ROOT, 'templates', 'asr_orchestrator', 'transcript-staging-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Transcript staging template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const outPath = getSafeWritePath(outputFolders.transcriptStaging, 'asr_transcript_staging_' + getFormattedDate(), '.md');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SOURCE_AUDIO\}\}/g, audioPathRel)
    .replace(/\{\{JOB_PACKET\}\}/g, `outputs/asr_orchestrator/job_packets/${jobPacketFilename}`)
    .replace(/\{\{TRANSCRIPT_STATUS\}\}/g, 'awaiting_manual_or_future_asr')
    .replace(/\{\{TRANSCRIPT_TEXT_PLACEHOLDER\}\}/g, '[AWAITING OFFLINE SPEECH TRANSLATION CAPABILITY]')
    .replace(/\{\{REVIEW_STATUS\}\}/g, 'pending')
    .replace(/\{\{NEXT_ACTION\}\}/g, 'Deploy verified Whisper binary model files to parse audio recording.');

  fs.writeFileSync(outPath, content);

  const detailMsg = `ASR transcript staging placeholder successfully created. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_ASR_TRANSCRIPT_STAGING', detailMsg);

  // Update job packet status to staged
  let updatedJobText = jobText.replace(/Execution Status:\*\*?\s*[a-zA-Z_-]+/i, "Execution Status: staged");
  fs.writeFileSync(jobPacketPath, updatedJobText);

  await announceCompletion("ASR transcript staging record created.");
  return outPath;
}

// 5. status
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE ASR ORCHESTRATOR STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const readiness = getLatestFile(outputFolders.readinessReports, 'asr_readiness_report_');
  const jobPacket = getLatestFile(outputFolders.jobPackets, 'asr_job_packet_');
  const dryRun = getLatestFile(outputFolders.dryRuns, 'asr_dry_run_');
  const staging = getLatestFile(outputFolders.transcriptStaging, 'asr_transcript_staging_');

  // Verify staged audio folder
  const recordingsDir = path.join(REPO_ROOT, stagedAudioDirectory);
  let audioFilesCount = 0;
  if (fs.existsSync(recordingsDir)) {
    audioFilesCount = fs.readdirSync(recordingsDir)
      .filter(f => ALLOWED_AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase())).length;
  }

  // Verify model
  const modelsDir = path.join(REPO_ROOT, modelDirectory);
  let modelFound = 'No';
  if (fs.existsSync(modelsDir)) {
    const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.bin') || f.endsWith('.onnx'));
    if (files.length > 0) {
      modelFound = 'Yes';
    }
  }

  // Env
  const envVal = process.env[EXPECTED_MANUAL_ENABLE_VAR];
  const asrEnabled = envVal === 'true' ? 'Yes' : 'No';

  let score = 0;
  if (audioFilesCount > 0) score += 30;
  if (fs.existsSync(modelsDir)) score += 20;
  if (modelFound === 'Yes') score += 20;
  if (envVal !== undefined) score += 15;
  if (asrEnabled === 'Yes') score += 15;

  console.log(`Latest Readiness Report: ${readiness}`);
  console.log(`Latest Job Packet:      ${jobPacket}`);
  console.log(`Latest Dry Run Report:   ${dryRun}`);
  console.log(`Latest Staging Record:   ${staging}`);
  console.log(`Staged Audio Found:      ${audioFilesCount > 0 ? 'Yes' : 'No'} (${audioFilesCount} files)`);
  console.log(`ASR Model Found:         ${modelFound}`);
  console.log(`ASR Execution Enabled:   ${asrEnabled}`);
  console.log(`Readiness Score:         ${score}%`);

  if (!ALLOW_ASR_EXECUTION) {
    console.log("Recommended Action:      ASR execution is disabled by safety policy configuration.");
  } else if (score < 100) {
    console.log("Recommended Action:      Ensure Whisper model binary is placed under models/asr/whisper/, stage audio, set ASR_EXECUTION_ENABLED=true.");
  } else {
    console.log("Recommended Action:      Ready to run future speech-to-text execution compiler.");
  }
  console.log("=========================================");
}

async function main() {
  ensureDirectories();

  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase() || 'help';

  // Safety validation
  if (!ASR_ORCHESTRATION_ONLY) {
    console.error("❌ Safety Gate Triggered: ASR orchestrator is not in orchestration-only mode.");
    process.exit(1);
  }

  if (ALLOW_ASR_EXECUTION || ALLOW_EXTERNAL_API_CALLS || ALLOW_AUDIO_UPLOAD || ALLOW_SHELL_EXECUTION) {
    console.error("❌ Safety Gate Triggered: Safety policies are incorrectly configured.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run asr-orchestrator-help' for detailed instructions.");
    } else if (command === 'readiness') {
      await handleReadiness();
    } else if (command === 'create-job') {
      await handleCreateJob();
    } else if (command === 'dry-run') {
      await handleDryRun();
    } else if (command === 'stage-transcript') {
      await handleStageTranscript();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ ASR orchestrator execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
