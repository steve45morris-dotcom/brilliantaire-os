import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  RECORDER_SCAFFOLD_ONLY,
  ALLOW_MICROPHONE_RECORDING,
  ALLOW_ASR_EXECUTION,
  ALLOW_TTS_GENERATION,
  ALLOW_EXTERNAL_API_CALLS,
  REQUIRE_MANUAL_AUDIO_DROP,
  REQUIRE_MANUAL_REVIEW,
  ALLOWED_AUDIO_EXTENSIONS,
  MAX_AUDIO_FILE_SIZE_BYTES,
  VALID_SESSION_TYPES,
  outputFolders,
  REPO_ROOT
} from '../config/voice-session-recorder.js';
import { announceIntent, announceCompletion } from './vnp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDirectories() {
  for (const dir of Object.values(outputFolders)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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
  const logFile = path.join(outputFolders.logs, `voice_session_recorder_log_${dateStr}.md`);
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

// 1. guide command
async function handleGuide(): Promise<string> {
  console.log("🛠️ Generating manual voice recording staging guide...");
  await announceIntent("Generating voice recording manual guide.");

  const templatePath = path.join(REPO_ROOT, 'templates', 'voice_sessions', 'manual-recording-guide-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Guide template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const sessionTypesList = VALID_SESSION_TYPES.map(t => `- **${t}**: Staged via manual drop protocol.`).join('\n');
  const sizeFormatted = (MAX_AUDIO_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0) + 'MB';

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{MANUAL_RECORDING_FOLDER\}\}/g, 'voice_sessions/manual_recordings/')
    .replace(/\{\{ALLOWED_FORMATS\}\}/g, ALLOWED_AUDIO_EXTENSIONS.join(', '))
    .replace(/\{\{SIZE_LIMIT\}\}/g, sizeFormatted)
    .replace(/\{\{SESSION_TYPES\}\}/g, sessionTypesList)
    .replace(/\{\{NEXT_ACTION\}\}/g, "Prepare manual audio recording drop and match metadata.");

  const outPath = getSafeWritePath(outputFolders.reviewReports, 'voice_session_manual_recording_guide_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Voice session staging guide generated. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_RECORDING_GUIDE', detailMsg);

  await announceCompletion("Voice session guide compiled.");
  return outPath;
}

// 2. create-session command
async function handleCreateSession(sessionType: string): Promise<string> {
  console.log(`🎙️ Initializing new metadata for session type: "${sessionType}"...`);
  await announceIntent(`Creating voice session metadata for ${sessionType}.`);

  if (!VALID_SESSION_TYPES.includes(sessionType)) {
    throw new Error(`Invalid session type: "${sessionType}". Approved types: ${VALID_SESSION_TYPES.join(', ')}`);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'voice_sessions', 'session-metadata-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Session metadata template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const dateStr = getFormattedDate();
  const cleanType = sessionType.replace(/\s+/g, '_');
  const baseName = `voice_session_${cleanType}_${dateStr}`;
  const outPath = getSafeWritePath(outputFolders.sessionMetadata, baseName, '.md');
  const sessionId = path.basename(outPath, '.md');

  const content = template
    .replace(/\{\{SESSION_ID\}\}/g, sessionId)
    .replace(/\{\{SESSION_TYPE\}\}/g, sessionType)
    .replace(/\{\{CREATED_AT\}\}/g, new Date().toISOString())
    .replace(/\{\{INTENDED_SCRIPT_SOURCE\}\}/g, "Offline Narrator Brief Staging")
    .replace(/\{\{EXPECTED_AUDIO_FILE\}\}/g, `voice_sessions/manual_recordings/${sessionId}.wav`)
    .replace(/\{\{RECORDING_STATUS\}\}/g, "awaiting_manual_audio")
    .replace(/\{\{ASR_STATUS\}\}/g, "not_started")
    .replace(/\{\{TTS_STATUS\}\}/g, "not_applicable")
    .replace(/\{\{REVIEW_STATUS\}\}/g, "pending");

  fs.writeFileSync(outPath, content);

  const detailMsg = `Session metadata successfully initialized. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('CREATE_SESSION_METADATA', detailMsg);

  await announceCompletion("Voice session metadata initialized.");
  return outPath;
}

// 3. scan-recordings command
async function handleScanRecordings(): Promise<string> {
  console.log("🔬 Scanning manual recordings folder for inventory...");
  await announceIntent("Scanning manual voice recordings.");

  const files = fs.readdirSync(outputFolders.manualRecordings);
  const allowedFiles: string[] = [];
  const unsupportedFiles: string[] = [];
  const oversizedFiles: string[] = [];
  const fileSizes: string[] = [];
  const candidateSessionLinks: string[] = [];

  const metadataFiles = fs.readdirSync(outputFolders.sessionMetadata).map(f => path.basename(f, '.md'));

  for (const file of files) {
    if (file === '.DS_Store' || file === 'README.md' || file === 'SKILL.md') continue;
    const fullPath = path.join(outputFolders.manualRecordings, file);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);

    const sizeMB = stat.size / (1024 * 1024);
    fileSizes.push(`${file} (${sizeMB.toFixed(2)} MB)`);

    if (stat.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      oversizedFiles.push(file);
    } else if (!ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      unsupportedFiles.push(file);
    } else {
      allowedFiles.push(file);
    }

    if (metadataFiles.includes(base)) {
      candidateSessionLinks.push(`${file} -> ${base}.md`);
    }
  }

  const outPath = getSafeWritePath(outputFolders.reviewReports, 'voice_recording_inventory_' + getFormattedDate(), '.md');
  
  let content = `# 🗃️ Voice Recording Inventory Report: ${getFormattedDate()}\n\n`;
  content += `*   **Manual Recordings Folder:** \`voice_sessions/manual_recordings/\`\n`;
  content += `*   **Allowed Files:** ${allowedFiles.length > 0 ? allowedFiles.join(', ') : 'None'}\n`;
  content += `*   **Unsupported Files:** ${unsupportedFiles.length > 0 ? unsupportedFiles.join(', ') : 'None'}\n`;
  content += `*   **Oversized Files:** ${oversizedFiles.length > 0 ? oversizedFiles.join(', ') : 'None'}\n`;
  content += `*   **File Sizes:** ${fileSizes.length > 0 ? fileSizes.join(', ') : 'No files found'}\n`;
  content += `*   **Candidate Session Links:** ${candidateSessionLinks.length > 0 ? candidateSessionLinks.join('; ') : 'None'}\n\n`;
  content += `---\n`;
  
  if (allowedFiles.length > 0 && candidateSessionLinks.length > 0) {
    content += `**Next Action Recommended:** Run matching voice review checks on candidate sessions.\n`;
  } else {
    content += `**Next Action Recommended:** Place formatted audio clips inside the manual recordings folder and link to session metadata.\n`;
  }

  fs.writeFileSync(outPath, content);

  const detailMsg = `Staged recording inventory compiled. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_RECORDING_INVENTORY', detailMsg);

  await announceCompletion("Staged recording inventory audit complete.");
  return outPath;
}

// 4. review command
async function handleReview(): Promise<string> {
  console.log("🔬 Auditing matching audio file sizes, formats and ASR eligibility...");
  await announceIntent("Reviewing staged voice session recordings.");

  // Get latest session metadata
  const latestMetadataPath = getLatestFileInDir(outputFolders.sessionMetadata, 'voice_session_');
  if (!latestMetadataPath) {
    throw new Error("No voice session metadata found. Run create-session first.");
  }

  const metadataBase = path.basename(latestMetadataPath, '.md');
  const metadataText = fs.readFileSync(latestMetadataPath, 'utf-8');
  
  // Look for any audio file starting with the metadata base name
  const manualFiles = fs.readdirSync(outputFolders.manualRecordings);
  const matchedAudio = manualFiles.find(f => {
    const ext = path.extname(f).toLowerCase();
    const base = path.basename(f, ext);
    return base === metadataBase;
  });

  const templatePath = path.join(REPO_ROOT, 'templates', 'voice_sessions', 'recording-review-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Review template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  let audioFileResult = 'No';
  let formatCheck = 'N/A';
  let sizeCheck = 'N/A';
  let asrEligible = 'INELIGIBLE';
  let reviewStatus = 'pending';
  const blockers: string[] = [];

  if (matchedAudio) {
    audioFileResult = `Yes (${matchedAudio})`;
    const fullAudioPath = path.join(outputFolders.manualRecordings, matchedAudio);
    const stat = fs.statSync(fullAudioPath);
    const ext = path.extname(matchedAudio).toLowerCase();

    if (ALLOWED_AUDIO_EXTENSIONS.includes(ext)) {
      formatCheck = `PASSED (Format ${ext} is allowed)`;
    } else {
      formatCheck = `FAILED (Format ${ext} is not allowed)`;
      blockers.push(`Unsupported file format: ${ext}`);
    }

    if (stat.size <= MAX_AUDIO_FILE_SIZE_BYTES) {
      sizeCheck = `PASSED (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`;
    } else {
      sizeCheck = `FAILED (Oversized: ${(stat.size / (1024 * 1024)).toFixed(2)} MB)`;
      blockers.push(`File size exceeds 100MB limit.`);
    }

    if (blockers.length === 0) {
      asrEligible = 'ELIGIBLE';
      reviewStatus = 'passed';
    } else {
      reviewStatus = 'failed';
    }
  } else {
    blockers.push(`Staged audio file matching "${metadataBase}" is missing.`);
  }

  const blockersText = blockers.length > 0 ? blockers.map(b => `- ${b}`).join('\n') : "- None";
  const nextAction = reviewStatus === 'passed'
    ? "Proceed to stage transcription for offline speech translation."
    : "Stage matching audio drop, rename correctly, and recheck.";

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{SESSION_METADATA\}\}/g, path.basename(latestMetadataPath))
    .replace(/\{\{MATCHING_AUDIO_FILE\}\}/g, audioFileResult)
    .replace(/\{\{FORMAT_CHECK\}\}/g, formatCheck)
    .replace(/\{\{SIZE_CHECK\}\}/g, sizeCheck)
    .replace(/\{\{ASR_ELIGIBILITY\}\}/g, asrEligible)
    .replace(/\{\{REVIEW_STATUS\}\}/g, reviewStatus)
    .replace(/\{\{BLOCKERS\}\}/g, blockersText)
    .replace(/\{\{NEXT_ACTION\}\}/g, nextAction);

  const outPath = getSafeWritePath(outputFolders.reviewReports, 'voice_session_review_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Recording review report generated. Status: ${reviewStatus}. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_RECORDING_REVIEW', detailMsg);

  // If passed, update metadata review state
  if (reviewStatus === 'passed') {
    let updatedMetadata = metadataText
      .replace(/Recording Status:\*\*?\s*[a-zA-Z_-]+/i, "Recording Status: present")
      .replace(/Review Status:\*\*?\s*[a-zA-Z_-]+/i, "Review Status: passed");
    fs.writeFileSync(latestMetadataPath, updatedMetadata);
    logEvent('UPDATE_METADATA_STATUS', `Staging review status updated to passed for ${path.basename(latestMetadataPath)}.`);
  }

  await announceCompletion("Staged recording review complete.");
  return outPath;
}

// 5. stage-transcription command
async function handleStageTranscription(): Promise<string> {
  console.log("🔬 Creating transcription staging records...");
  await announceIntent("Staging recording transcription records.");

  const latestReviewPath = getLatestFileInDir(outputFolders.reviewReports, 'voice_session_review_');
  if (!latestReviewPath) {
    throw new Error("No voice session review report found. Run review first.");
  }

  const reviewText = fs.readFileSync(latestReviewPath, 'utf-8');
  
  const eligibleMatch = reviewText.match(/ASR Eligibility:\*\*?\s*(ELIGIBLE|INELIGIBLE)/i);
  const isEligible = eligibleMatch ? eligibleMatch[1].toUpperCase() === 'ELIGIBLE' : false;

  const metadataMatch = reviewText.match(/Session Metadata:\*\*?\s*`?([a-zA-Z_0-9.-]+)`?/i);
  const metadataFilename = metadataMatch ? metadataMatch[1].trim() : '';

  if (!isEligible || !metadataFilename) {
    console.warn("⚠️ Warning: Latest voice session review is ineligible or missing matching audio. Transcription staging blocked.");
    return '';
  }

  const metadataPath = path.join(outputFolders.sessionMetadata, metadataFilename);
  const metadataText = fs.readFileSync(metadataPath, 'utf-8');
  const metadataBase = path.basename(metadataPath, '.md');

  // Locate the audio file
  const manualFiles = fs.readdirSync(outputFolders.manualRecordings);
  const matchedAudio = manualFiles.find(f => {
    const ext = path.extname(f).toLowerCase();
    const base = path.basename(f, ext);
    return base === metadataBase;
  });

  if (!matchedAudio) {
    throw new Error(`Matched audio file not found in manual recordings directory for ${metadataBase}`);
  }

  const templatePath = path.join(REPO_ROOT, 'templates', 'voice_sessions', 'transcription-staging-template.md');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Transcription staging template not found at: ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const content = template
    .replace(/\{\{DATE\}\}/g, getFormattedDate())
    .replace(/\{\{AUDIO_FILE\}\}/g, `voice_sessions/manual_recordings/${matchedAudio}`)
    .replace(/\{\{SESSION_METADATA\}\}/g, `voice_sessions/session_metadata/${metadataFilename}`)
    .replace(/\{\{TRANSCRIPTION_STATUS\}\}/g, 'staged_not_transcribed')
    .replace(/\{\{ASR_ENGINE_PLACEHOLDER\}\}/g, 'Whisper Local (GGML)')
    .replace(/\{\{MANUAL_REVIEW_REQUIRED\}\}/g, 'Yes')
    .replace(/\{\{NEXT_ACTION\}\}/g, 'Invoke local Whisper ASR compiler runner on staged audio file.');

  const outPath = getSafeWritePath(outputFolders.transcriptionStaging, 'voice_transcription_staging_' + getFormattedDate(), '.md');
  fs.writeFileSync(outPath, content);

  const detailMsg = `Transcription staging record successfully created. Saved to: ${path.basename(outPath)}`;
  console.log(`✅ ${detailMsg}`);
  logEvent('COMPILE_TRANSCRIPTION_STAGING', detailMsg);

  // Update metadata ASR state
  let updatedMetadata = metadataText.replace(/ASR Status:\*\*?\s*[a-zA-Z_-]+/i, "ASR Status: staged");
  fs.writeFileSync(metadataPath, updatedMetadata);

  await announceCompletion("Staged transcription record compiled.");
  return outPath;
}

// 6. status
function handleStatus() {
  console.log("=========================================");
  console.log("🔬 OFFLINE VOICE SESSION RECORDER STATUS");
  console.log("=========================================");

  const getLatestFile = (dir: string, prefix: string): string => {
    const f = getLatestFileInDir(dir, prefix);
    return f ? path.basename(f) : 'None generated';
  };

  const guide = getLatestFile(outputFolders.reviewReports, 'voice_session_manual_recording_guide');
  const metadata = getLatestFile(outputFolders.sessionMetadata, 'voice_session_');
  const inventory = getLatestFile(outputFolders.reviewReports, 'voice_recording_inventory');
  const review = getLatestFile(outputFolders.reviewReports, 'voice_session_review');
  const staging = getLatestFile(outputFolders.transcriptionStaging, 'voice_transcription_staging');

  let audioFilesCount = 0;
  if (fs.existsSync(outputFolders.manualRecordings)) {
    audioFilesCount = fs.readdirSync(outputFolders.manualRecordings)
      .filter(f => f !== '.DS_Store' && f !== 'README.md' && f !== 'SKILL.md').length;
  }

  let asrEligible = 'No';
  let hasBlockers = true;

  if (review !== 'None generated') {
    const reviewPath = path.join(outputFolders.reviewReports, review);
    const reviewText = fs.readFileSync(reviewPath, 'utf-8');
    const eligibleMatch = reviewText.match(/ASR Eligibility:\*\*?\s*(ELIGIBLE|INELIGIBLE)/i);
    asrEligible = eligibleMatch ? eligibleMatch[1].trim() : 'No';
    hasBlockers = reviewText.includes('Blockers') && !reviewText.includes('Blockers\n- None');
  }

  console.log(`Latest Recording Guide:  ${guide}`);
  console.log(`Latest Session Metadata: ${metadata}`);
  console.log(`Latest Inventory Scan:   ${inventory}`);
  console.log(`Latest Review Report:    ${review}`);
  console.log(`Latest Staging Record:   ${staging}`);
  console.log(`Audio Files Found:       ${audioFilesCount > 0 ? 'Yes' : 'No'} (${audioFilesCount} files)`);
  console.log(`ASR Eligible:            ${asrEligible}`);

  if (hasBlockers) {
    console.log("Recommended Action:      Read recording guide, drop audio file manually, rename base to match session, and run review.");
  } else {
    console.log("Recommended Action:      Session review passed. Stable to trigger offline Whisper transcription staging.");
  }
  console.log("=========================================");
}

async function main() {
  ensureDirectories();

  const args = process.argv.slice(2);
  let command = '';
  let sessionType = '';

  const fullInput = args.join(' ').trim();
  if (fullInput.toLowerCase().startsWith('create-session')) {
    command = 'create-session';
    sessionType = fullInput.substring(14).trim().toLowerCase();
  } else {
    const parts = fullInput.split(/\s+/);
    command = parts[0]?.toLowerCase() || 'help';
    sessionType = parts.slice(1).join(' ').trim().toLowerCase();
  }

  // Safety Gate Checks
  if (!RECORDER_SCAFFOLD_ONLY) {
    console.error("❌ Safety Gate Triggered: Voice session recorder is not in scaffold-only mode.");
    process.exit(1);
  }

  if (ALLOW_MICROPHONE_RECORDING || ALLOW_ASR_EXECUTION || ALLOW_TTS_GENERATION || ALLOW_EXTERNAL_API_CALLS) {
    console.error("❌ Safety Gate Triggered: Microphone captures or speech recognition processes are incorrectly enabled.");
    process.exit(1);
  }

  try {
    if (command === 'help') {
      console.log("Run 'npm run voice-session-recorder-help' for detailed instructions.");
    } else if (command === 'guide') {
      await handleGuide();
    } else if (command === 'create-session') {
      await handleCreateSession(sessionType);
    } else if (command === 'scan-recordings') {
      await handleScanRecordings();
    } else if (command === 'review') {
      await handleReview();
    } else if (command === 'stage-transcription') {
      await handleStageTranscription();
    } else if (command === 'status') {
      handleStatus();
    } else {
      console.error(`❌ Unknown command: "${command} ${sessionType}". Safe fallback triggered. Command failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Voice session recorder execution error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
