import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import {
  REC_RECORDINGS_DIR,
  REC_METADATA_DIR,
  REC_ARCHIVE_DIR,
  REC_REJECTED_DIR,
  REC_LOGS_DIR,
  REC_ASR_INPUT_DIR,
  ALLOWED_AUDIO_FORMATS,
  DEFAULT_RECORDING_FORMAT,
  MAX_RECORDING_DURATION_SECONDS,
  MAX_FILE_SIZE_BYTES,
  LIVE_MIC_ENABLED,
  BACKGROUND_RECORDING_ENABLED,
  AUTO_TRANSCRIBE_AFTER_RECORDING,
  AUTO_APPROVE_TRANSCRIPT,
  AUTO_EXECUTE_COMMAND,
  CONFIRMATION_REQUIRED,
  OVERWRITE_RECORDINGS,
  SESSION_NAMING_PATTERN
} from '../config/narrator-voice-session-recorder.config.js';

interface SessionMetadata {
  id: string;
  name: string;
  audioPath: string;
  metadataPath: string;
  recordedAt: string;
  durationSeconds: number;
  fileSizeBytes: number;
  status: string; // 'recording' | 'stopped' | 'rejected' | 'archived'
  stagedForAsr: boolean;
  stagedAt: string;
  rejected: boolean;
  archived: boolean;
}

const activeSessionPath = path.join(process.cwd(), 'outputs/narrator/voice_sessions/active_session.json');

function ensureDirs() {
  fs.mkdirSync(REC_RECORDINGS_DIR, { recursive: true });
  fs.mkdirSync(REC_METADATA_DIR, { recursive: true });
  fs.mkdirSync(REC_ARCHIVE_DIR, { recursive: true });
  fs.mkdirSync(REC_REJECTED_DIR, { recursive: true });
  fs.mkdirSync(REC_LOGS_DIR, { recursive: true });
  fs.mkdirSync(REC_ASR_INPUT_DIR, { recursive: true });
}

function logEvent(event: string) {
  ensureDirs();
  const logMsg = `[${new Date().toISOString()}] ${event}\n`;
  fs.appendFileSync(path.join(REC_LOGS_DIR, 'voice_recorder.log'), logMsg);
}

function getTimestampStr(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

interface BackendStatus {
  available: boolean;
  binary: string;
  path: string;
}

function detectBackend(): BackendStatus {
  try {
    const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf-8' }).trim();
    if (ffmpegPath) {
      return { available: true, binary: 'ffmpeg', path: ffmpegPath };
    }
  } catch (err) {}

  try {
    const recPath = execSync('which rec', { encoding: 'utf-8' }).trim();
    if (recPath) {
      return { available: true, binary: 'rec', path: recPath };
    }
  } catch (err) {}

  try {
    const soxPath = execSync('which sox', { encoding: 'utf-8' }).trim();
    if (soxPath) {
      return { available: true, binary: 'sox', path: soxPath };
    }
  } catch (err) {}

  return { available: false, binary: 'none', path: '' };
}

function createSilentWav(filePath: string) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeInt32(36, 4, true);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeInt32(16, 16, true);
  header.writeInt16(1, 20, true);
  header.writeInt16(1, 22, true);
  header.writeInt32(8000, 24, true);
  header.writeInt32(8000 * 2, 28, true);
  header.writeInt16(2, 32, true);
  header.writeInt16(16, 34, true);
  header.write('data', 36);
  header.writeInt32(0, 40, true);
  fs.writeFileSync(filePath, header);
}

function loadTemplate(name: string): string {
  const tplPath = path.join(process.cwd(), 'templates/narrator_voice_session', `${name}.md`);
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf-8');
  }
  return '';
}

function getSessionCounts() {
  ensureDirs();
  const metadataFiles = fs.readdirSync(REC_METADATA_DIR).filter(f => f.endsWith('.json'));
  let total = 0;
  let staged = 0;
  let rejected = 0;
  let archived = 0;

  metadataFiles.forEach(f => {
    try {
      const meta: SessionMetadata = JSON.parse(fs.readFileSync(path.join(REC_METADATA_DIR, f), 'utf-8'));
      total++;
      if (meta.stagedForAsr) staged++;
      if (meta.rejected) rejected++;
      if (meta.archived) archived++;
    } catch (e) {}
  });

  return { total, staged, rejected, archived };
}

// ─── Status ──────────────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const backend = detectBackend();
  const counts = getSessionCounts();
  const activeExists = fs.existsSync(activeSessionPath);
  let activeSessionId = 'None';
  
  if (activeExists) {
    try {
      const act = JSON.parse(fs.readFileSync(activeSessionPath, 'utf-8'));
      activeSessionId = act.id;
    } catch (e) {}
  }

  const template = loadTemplate('voice-session-status-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{REC_RECORDINGS_DIR}}/g, REC_RECORDINGS_DIR)
    .replace(/{{REC_METADATA_DIR}}/g, REC_METADATA_DIR)
    .replace(/{{REC_ASR_INPUT_DIR}}/g, REC_ASR_INPUT_DIR)
    .replace(/{{REC_ARCHIVE_DIR}}/g, REC_ARCHIVE_DIR)
    .replace(/{{REC_REJECTED_DIR}}/g, REC_REJECTED_DIR)
    .replace(/{{LIVE_MIC_ENABLED}}/g, String(LIVE_MIC_ENABLED))
    .replace(/{{BACKGROUND_RECORDING_ENABLED}}/g, String(BACKGROUND_RECORDING_ENABLED))
    .replace(/{{AUTO_TRANSCRIBE}}/g, String(AUTO_TRANSCRIBE_AFTER_RECORDING))
    .replace(/{{AUTO_APPROVE}}/g, String(AUTO_APPROVE_TRANSCRIPT))
    .replace(/{{AUTO_EXECUTE}}/g, String(AUTO_EXECUTE_COMMAND))
    .replace(/{{CONFIRMATION_REQUIRED}}/g, String(CONFIRMATION_REQUIRED))
    .replace(/{{TOTAL_SESSIONS}}/g, String(counts.total))
    .replace(/{{ACTIVE_SESSION}}/g, activeSessionId)
    .replace(/{{STAGED_COUNT}}/g, String(counts.staged))
    .replace(/{{REJECTED_COUNT}}/g, String(counts.rejected))
    .replace(/{{ARCHIVED_COUNT}}/g, String(counts.archived))
    .replace(/{{DETECTED_BACKEND}}/g, backend.binary === 'none' ? 'None Detected' : `${backend.binary} (${backend.path})`)
    .replace(/{{BACKEND_STATUS}}/g, backend.available ? 'AVAILABLE' : 'UNAVAILABLE (Falling back to simulated/silent session files)');

  console.log(output);
}

// ─── Start Session ───────────────────────────────────────────────────────────
function handleStartSession(sessionNameInput: string) {
  ensureDirs();
  const sessionName = (sessionNameInput || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
  
  if (fs.existsSync(activeSessionPath)) {
    console.error('❌ Error: Another voice recording session is already active.');
    process.exit(1);
  }

  const timestamp = getTimestampStr();
  const sessionId = `voice_session_${sessionName}_${timestamp}`;
  const audioFilename = `${sessionId}.${DEFAULT_RECORDING_FORMAT}`;
  const audioPath = path.join(REC_RECORDINGS_DIR, audioFilename);
  const metadataFilename = `${sessionId}.json`;
  const metadataPath = path.join(REC_METADATA_DIR, metadataFilename);

  const backend = detectBackend();
  logEvent(`START_SESSION Triggered | ID: ${sessionId} | Name: ${sessionName} | Format: ${DEFAULT_RECORDING_FORMAT}`);

  console.log(`🎙️ Initializing Voice Recording Session: ${sessionId}`);
  console.log(`   Format: ${DEFAULT_RECORDING_FORMAT} | Timeout: ${MAX_RECORDING_DURATION_SECONDS}s`);

  let spawnedPid = 0;
  let isSimulated = false;

  if (backend.available && backend.binary === 'ffmpeg') {
    // Spawn ffmpeg with avfoundation to record from microphone index 0
    console.log(`[INFO] Spawning ffmpeg recorder backend...`);
    const proc = spawn(backend.path, [
      '-y',
      '-f', 'avfoundation',
      '-i', ':0',
      '-t', String(MAX_RECORDING_DURATION_SECONDS),
      audioPath
    ], {
      stdio: 'ignore',
      detached: true
    });
    
    proc.unref();
    spawnedPid = proc.pid || 0;

    // Check if the process exits immediately (avfoundation failure or sandbox blocked)
    setTimeout(() => {
      try {
        if (proc.exitCode !== null && proc.exitCode !== 0) {
          console.log(`[WARNING] Recorder backend exited unexpectedly. Generating simulated silent wave...`);
          createSilentWav(audioPath);
          logEvent(`SIMULATED_FALLBACK | Reason: ffmpeg exitCode ${proc.exitCode}`);
        }
      } catch (e) {}
    }, 400);

  } else {
    console.log(`[INFO] No recording hardware active or backend missing. Generating simulated offline recording file...`);
    createSilentWav(audioPath);
    isSimulated = true;
  }

  const activeSessionData = {
    id: sessionId,
    name: sessionName,
    audioPath,
    metadataPath,
    startedAt: new Date().toISOString(),
    pid: spawnedPid,
    isSimulated
  };

  fs.writeFileSync(activeSessionPath, JSON.stringify(activeSessionData, null, 2), 'utf-8');
  console.log(`✅ Success: Session started. Run "npm run narrator-voice-session-recorder stop-session ${sessionId}" to complete.`);
}

// ─── Stop Session ────────────────────────────────────────────────────────────
function handleStopSession(sessionIdInput: string) {
  ensureDirs();
  if (!fs.existsSync(activeSessionPath)) {
    console.error('❌ Error: No active voice recording session found to stop.');
    process.exit(1);
  }

  let active;
  try {
    active = JSON.parse(fs.readFileSync(activeSessionPath, 'utf-8'));
  } catch (e) {
    console.error('❌ Error: Active session descriptor file is corrupted.');
    process.exit(1);
  }

  if (sessionIdInput && active.id !== sessionIdInput) {
    console.error(`❌ Error: Specified Session ID "${sessionIdInput}" does not match active session "${active.id}".`);
    process.exit(1);
  }

  console.log(`🛑 Stopping Voice Recording Session: ${active.id}`);

  // Kill recording process if running
  if (active.pid) {
    try {
      process.kill(-active.pid, 'SIGINT'); // kill process group
    } catch (e) {
      try {
        process.kill(active.pid, 'SIGINT');
      } catch (err) {}
    }
  }

  // Ensure file is written
  if (active.isSimulated || !fs.existsSync(active.audioPath)) {
    createSilentWav(active.audioPath);
  }

  const fileStats = fs.existsSync(active.audioPath) ? fs.statSync(active.audioPath) : { size: 0 };
  const duration = Math.round((Date.now() - new Date(active.startedAt).getTime()) / 1000);

  const metadata: SessionMetadata = {
    id: active.id,
    name: active.name,
    audioPath: active.audioPath,
    metadataPath: active.metadataPath,
    recordedAt: active.startedAt,
    durationSeconds: duration > 0 ? duration : 1,
    fileSizeBytes: fileStats.size,
    status: 'stopped',
    stagedForAsr: false,
    stagedAt: '',
    rejected: false,
    archived: false
  };

  // Save metadata JSON
  fs.writeFileSync(active.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // Save metadata MD
  const template = loadTemplate('voice-session-metadata-template');
  const mdOutput = template
    .replace(/{{SESSION_ID}}/g, metadata.id)
    .replace(/{{SESSION_NAME}}/g, metadata.name)
    .replace(/{{RECORDED_AT}}/g, metadata.recordedAt)
    .replace(/{{AUDIO_PATH}}/g, metadata.audioPath)
    .replace(/{{AUDIO_FORMAT}}/g, DEFAULT_RECORDING_FORMAT)
    .replace(/{{DURATION_SECONDS}}/g, String(metadata.durationSeconds))
    .replace(/{{FILE_SIZE_BYTES}}/g, String(metadata.fileSizeBytes))
    .replace(/{{STATUS}}/g, metadata.status)
    .replace(/{{STAGED_FOR_ASR}}/g, String(metadata.stagedForAsr))
    .replace(/{{STAGED_AT}}/g, 'None')
    .replace(/{{REJECTED}}/g, String(metadata.rejected))
    .replace(/{{ARCHIVED}}/g, String(metadata.archived));

  const mdPath = active.metadataPath.replace('.json', '.md');
  fs.writeFileSync(mdPath, mdOutput, 'utf-8');

  // Remove active indicator
  try {
    fs.unlinkSync(activeSessionPath);
  } catch (e) {}

  logEvent(`STOP_SESSION | ID: ${active.id} | Duration: ${metadata.durationSeconds}s | Size: ${metadata.fileSizeBytes} bytes`);
  console.log(`✅ Success: Session stopped. Audio and metadata saved.`);
}

// ─── List Sessions ───────────────────────────────────────────────────────────
function handleListSessions() {
  ensureDirs();
  const files = fs.readdirSync(REC_METADATA_DIR).filter(f => f.endsWith('.json')).sort();

  console.log('\n=========================================');
  console.log('📋 Recent Offline Voice Recording Sessions');
  console.log('=========================================');

  if (files.length === 0) {
    console.log('No recorded voice sessions found.');
    console.log('=========================================\n');
    return;
  }

  files.forEach(f => {
    try {
      const meta: SessionMetadata = JSON.parse(fs.readFileSync(path.join(REC_METADATA_DIR, f), 'utf-8'));
      console.log(`- ID: ${meta.id} | Name: "${meta.name}" | Status: ${meta.status} | Staged for ASR: ${meta.stagedForAsr}`);
    } catch (e) {}
  });

  console.log('=========================================\n');
}

// ─── Session Detail ──────────────────────────────────────────────────────────
function handleSessionDetail(sessionId: string) {
  ensureDirs();
  const jsonPath = path.join(REC_METADATA_DIR, `${sessionId}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Voice session metadata file not found: ${jsonPath}`);
    process.exit(1);
  }

  let meta: SessionMetadata;
  try {
    meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Error: Metadata file is corrupted.`);
    process.exit(1);
  }

  const template = loadTemplate('voice-session-detail-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{SESSION_ID}}/g, meta.id)
    .replace(/{{SESSION_NAME}}/g, meta.name)
    .replace(/{{FILE_NAME}}/g, path.basename(meta.audioPath))
    .replace(/{{AUDIO_PATH}}/g, meta.audioPath)
    .replace(/{{METADATA_PATH}}/g, meta.metadataPath)
    .replace(/{{AUDIO_FORMAT}}/g, DEFAULT_RECORDING_FORMAT)
    .replace(/{{DURATION_SECONDS}}/g, String(meta.durationSeconds))
    .replace(/{{FILE_SIZE_BYTES}}/g, String(meta.fileSizeBytes))
    .replace(/{{STATUS}}/g, meta.status)
    .replace(/{{STAGED_FOR_ASR}}/g, String(meta.stagedForAsr))
    .replace(/{{ASR_TARGET_PATH}}/g, meta.stagedForAsr ? path.join(REC_ASR_INPUT_DIR, path.basename(meta.audioPath)) : 'Not staged')
    .replace(/{{REJECTED}}/g, String(meta.rejected))
    .replace(/{{ARCHIVED}}/g, String(meta.archived));

  console.log(output);
}

// ─── Stage for ASR ───────────────────────────────────────────────────────────
function handleStageForAsr(sessionId: string) {
  ensureDirs();
  const jsonPath = path.join(REC_METADATA_DIR, `${sessionId}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Voice session metadata file not found: ${jsonPath}`);
    process.exit(1);
  }

  let meta: SessionMetadata;
  try {
    meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Error: Metadata file is corrupted.`);
    process.exit(1);
  }

  if (meta.rejected) {
    console.error('❌ Error: Refusing to stage a rejected voice session to ASR.');
    process.exit(1);
  }

  if (!fs.existsSync(meta.audioPath)) {
    console.error(`❌ Error: Target session audio file is missing: ${meta.audioPath}`);
    process.exit(1);
  }

  const targetFilename = path.basename(meta.audioPath);
  const targetPath = path.join(REC_ASR_INPUT_DIR, targetFilename);

  fs.copyFileSync(meta.audioPath, targetPath);

  meta.stagedForAsr = true;
  meta.stagedAt = new Date().toISOString();
  meta.status = 'staged_for_asr';

  // Save JSON
  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), 'utf-8');

  // Regenerate MD
  const template = loadTemplate('voice-session-metadata-template');
  const mdOutput = template
    .replace(/{{SESSION_ID}}/g, meta.id)
    .replace(/{{SESSION_NAME}}/g, meta.name)
    .replace(/{{RECORDED_AT}}/g, meta.recordedAt)
    .replace(/{{AUDIO_PATH}}/g, meta.audioPath)
    .replace(/{{AUDIO_FORMAT}}/g, DEFAULT_RECORDING_FORMAT)
    .replace(/{{DURATION_SECONDS}}/g, String(meta.durationSeconds))
    .replace(/{{FILE_SIZE_BYTES}}/g, String(meta.fileSizeBytes))
    .replace(/{{STATUS}}/g, meta.status)
    .replace(/{{STAGED_FOR_ASR}}/g, String(meta.stagedForAsr))
    .replace(/{{STAGED_AT}}/g, meta.stagedAt)
    .replace(/{{REJECTED}}/g, String(meta.rejected))
    .replace(/{{ARCHIVED}}/g, String(meta.archived));

  const mdPath = jsonPath.replace('.json', '.md');
  fs.writeFileSync(mdPath, mdOutput, 'utf-8');

  logEvent(`STAGE_FOR_ASR | ID: ${meta.id} | Target: ${targetPath}`);
  console.log(`✅ Success: Voice session recording "${meta.id}" staged for ASR transcription.`);
}

// ─── Reject Session ──────────────────────────────────────────────────────────
function handleRejectSession(sessionId: string) {
  ensureDirs();
  const jsonPath = path.join(REC_METADATA_DIR, `${sessionId}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Voice session metadata file not found: ${jsonPath}`);
    process.exit(1);
  }

  let meta: SessionMetadata;
  try {
    meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Error: Metadata file is corrupted.`);
    process.exit(1);
  }

  meta.rejected = true;
  meta.status = 'rejected';

  // Save JSON
  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), 'utf-8');

  // Save metadata to rejected folder
  fs.copyFileSync(jsonPath, path.join(REC_REJECTED_DIR, `${sessionId}.json`));
  const mdPath = jsonPath.replace('.json', '.md');
  if (fs.existsSync(mdPath)) {
    fs.copyFileSync(mdPath, path.join(REC_REJECTED_DIR, `${sessionId}.md`));
  }

  logEvent(`REJECT_SESSION | ID: ${meta.id}`);
  console.log(`✅ Success: Voice session recording "${meta.id}" marked rejected.`);
}

// ─── Archive Session ─────────────────────────────────────────────────────────
function handleArchiveSession(sessionId: string) {
  ensureDirs();
  const jsonPath = path.join(REC_METADATA_DIR, `${sessionId}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Voice session metadata file not found: ${jsonPath}`);
    process.exit(1);
  }

  let meta: SessionMetadata;
  try {
    meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Error: Metadata file is corrupted.`);
    process.exit(1);
  }

  meta.archived = true;
  meta.status = 'archived';

  const archivedJsonPath = path.join(REC_ARCHIVE_DIR, `${sessionId}.json`);
  const archivedAudioPath = path.join(REC_ARCHIVE_DIR, path.basename(meta.audioPath));

  // Move files
  if (fs.existsSync(meta.audioPath)) {
    fs.renameSync(meta.audioPath, archivedAudioPath);
  }

  meta.audioPath = archivedAudioPath;
  meta.metadataPath = archivedJsonPath;

  // Save JSON to new path
  fs.writeFileSync(archivedJsonPath, JSON.stringify(meta, null, 2), 'utf-8');

  // Remove old JSON
  try {
    fs.unlinkSync(jsonPath);
  } catch (e) {}

  // Move MD representation if exists
  const oldMdPath = jsonPath.replace('.json', '.md');
  const newMdPath = archivedJsonPath.replace('.json', '.md');
  if (fs.existsSync(oldMdPath)) {
    try {
      fs.renameSync(oldMdPath, newMdPath);
    } catch (e) {}
  }

  logEvent(`ARCHIVE_SESSION | ID: ${meta.id} | Archived Audio Path: ${archivedAudioPath}`);
  console.log(`✅ Success: Voice session recording "${meta.id}" moved to archive.`);
}

// ─── Latest Session ──────────────────────────────────────────────────────────
function handleLatestSession() {
  ensureDirs();
  const files = fs.readdirSync(REC_METADATA_DIR).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.log('No voice recording sessions found on disk.');
    return;
  }

  const latestFile = files[files.length - 1];
  const sessionId = latestFile.replace('.json', '');
  handleSessionDetail(sessionId);
}

// ─── Recorder Log ────────────────────────────────────────────────────────────
function handleRecorderLog() {
  ensureDirs();
  const logFilePath = path.join(REC_LOGS_DIR, 'voice_recorder.log');
  let logLines = 'No logs captured yet.';

  if (fs.existsSync(logFilePath)) {
    logLines = fs.readFileSync(logFilePath, 'utf-8');
  }

  const template = loadTemplate('voice-session-log-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{RECORDER_LOG_LINES}}/g, logLines);

  console.log(output);
}

// ─── CLI Dispatcher ──────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  let command = 'help';
  let target = '';

  if (args.length > 0) {
    if (args.length === 1 && args[0].includes(' ')) {
      const tokens = args[0].trim().split(/\s+/);
      command = tokens[0].toLowerCase();
      target = tokens.slice(1).join(' ');
    } else {
      command = args[0].toLowerCase();
      target = args[1] || '';
    }
  }

  const validCommands = [
    'help',
    'status',
    'start-session',
    'stop-session',
    'list-sessions',
    'session-detail',
    'stage-for-asr',
    'reject-session',
    'archive-session',
    'latest-session',
    'recorder-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown recorder command: "${command}". Run "npm run narrator-voice-session-recorder-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-session-recorder-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'start-session') {
    handleStartSession(target);
  } else if (command === 'stop-session') {
    handleStopSession(target);
  } else if (command === 'list-sessions') {
    handleListSessions();
  } else if (command === 'session-detail') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleSessionDetail(target);
  } else if (command === 'stage-for-asr') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleStageForAsr(target);
  } else if (command === 'reject-session') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleRejectSession(target);
  } else if (command === 'archive-session') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleArchiveSession(target);
  } else if (command === 'latest-session') {
    handleLatestSession();
  } else if (command === 'recorder-log') {
    handleRecorderLog();
  }
}

main();
