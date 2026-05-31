import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  ORCH_SESSIONS_RECORDINGS_DIR,
  ORCH_SESSIONS_METADATA_DIR,
  ORCH_ASR_INPUT_DIR,
  ORCH_ASR_TRANSCRIPTS_DIR,
  ORCH_ASR_STAGED_DIR,
  ORCH_ASR_APPROVED_DIR,
  ORCH_BRIDGE_READY_DIR,
  ORCH_BRIDGE_EXECUTED_DIR,
  ORCH_LOGS_DIR,
  ORCH_REPORTS_DIR,
  ALLOWED_SESSION_STATUSES,
  ALLOWED_AUDIO_EXTENSIONS,
  AUTO_TRANSCRIBE_AFTER_SESSION,
  AUTO_STAGE_COMMAND_AFTER_TRANSCRIPT,
  AUTO_APPROVE_TRANSCRIPT,
  AUTO_EXECUTE_COMMAND,
  CONFIRMATION_REQUIRED,
  DUPLICATE_DISPATCH_PROTECTION,
  MAX_BATCH_SIZE,
  DEFAULT_ORCHESTRATOR_MODE
} from '../config/narrator-voice-asr-orchestrator.config.js';

interface SessionMetadata {
  id: string;
  name: string;
  audioPath: string;
  metadataPath: string;
  recordedAt: string;
  durationSeconds: number;
  fileSizeBytes: number;
  status: string;
  stagedForAsr: boolean;
  stagedAt: string;
  rejected: boolean;
  archived: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date = new Date(), includeSeconds = false): string {
  const base = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return includeSeconds ? `${base}${pad(now.getSeconds())}` : base;
}

function ensureDirs() {
  fs.mkdirSync(ORCH_LOGS_DIR, { recursive: true });
  fs.mkdirSync(ORCH_REPORTS_DIR, { recursive: true });
}

function logEvent(event: string) {
  ensureDirs();
  const logMsg = `[${new Date().toISOString()}] ${event}\n`;
  fs.appendFileSync(path.join(ORCH_LOGS_DIR, 'orchestrator.log'), logMsg);
}

function loadTemplate(name: string): string {
  const tplPath = path.join(process.cwd(), 'templates/narrator_voice_asr_orchestrator', `${name}.md`);
  if (fs.existsSync(tplPath)) {
    return fs.readFileSync(tplPath, 'utf-8');
  }
  return '';
}

// ─── Status ──────────────────────────────────────────────────────────────────
function handleStatus() {
  ensureDirs();
  const getCount = (dir: string) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.wav')).length;
  };

  const isAsrListenerAvailable = fs.existsSync(path.join(process.cwd(), 'scripts/narrator-asr-listener.ts'));

  const template = loadTemplate('voice-asr-orchestrator-status-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{SESSIONS_METADATA_DIR}}/g, ORCH_SESSIONS_METADATA_DIR)
    .replace(/{{ASR_INPUT_DIR}}/g, ORCH_ASR_INPUT_DIR)
    .replace(/{{ASR_TRANSCRIPTS_DIR}}/g, ORCH_ASR_TRANSCRIPTS_DIR)
    .replace(/{{ASR_STAGED_DIR}}/g, ORCH_ASR_STAGED_DIR)
    .replace(/{{ASR_APPROVED_DIR}}/g, ORCH_ASR_APPROVED_DIR)
    .replace(/{{AUTO_TRANSCRIBE}}/g, String(AUTO_TRANSCRIBE_AFTER_SESSION))
    .replace(/{{AUTO_STAGE}}/g, String(AUTO_STAGE_COMMAND_AFTER_TRANSCRIPT))
    .replace(/{{AUTO_APPROVE}}/g, String(AUTO_APPROVE_TRANSCRIPT))
    .replace(/{{AUTO_EXECUTE}}/g, String(AUTO_EXECUTE_COMMAND))
    .replace(/{{DUPLICATE_PROTECTION}}/g, String(DUPLICATE_DISPATCH_PROTECTION))
    .replace(/{{TOTAL_SESSIONS}}/g, String(getCount(ORCH_SESSIONS_METADATA_DIR) / 2)) // dividing by 2 as json + md exist
    .replace(/{{DISPATCHED_ASR}}/g, String(getCount(ORCH_ASR_INPUT_DIR)))
    .replace(/{{TRANSCRIBED}}/g, String(getCount(ORCH_TRANSCRIPTS_DIR_SAFE())))
    .replace(/{{STAGED}}/g, String(getCount(ORCH_ASR_STAGED_DIR)))
    .replace(/{{APPROVED}}/g, String(getCount(ORCH_ASR_APPROVED_DIR)))
    .replace(/{{BLOCKED}}/g, String(getCount(path.join(process.cwd(), 'outputs/narrator/asr/rejected'))))
    .replace(/{{ASR_LISTENER_STATUS}}/g, isAsrListenerAvailable ? 'AVAILABLE (narrator-asr-listener)' : 'UNAVAILABLE');

  console.log(output);
}

function ORCH_TRANSCRIPTS_DIR_SAFE() {
  return ORCH_ASR_TRANSCRIPTS_DIR;
}

// ─── Scan Sessions ───────────────────────────────────────────────────────────
function handleScanSessions() {
  ensureDirs();
  if (!fs.existsSync(ORCH_SESSIONS_METADATA_DIR)) {
    console.log('No voice sessions metadata folder found.');
    return;
  }

  const files = fs.readdirSync(ORCH_SESSIONS_METADATA_DIR).filter(f => f.endsWith('.json')).sort();

  console.log('\n========================================================================');
  console.log('📊 Voice Session to ASR Pipeline Progress Map');
  console.log('========================================================================');

  if (files.length === 0) {
    console.log('No recordings registered in the local voice loop.');
    console.log('========================================================================\n');
    return;
  }

  files.forEach(f => {
    try {
      const sessionId = f.replace('.json', '');
      
      const hasAudio = fs.existsSync(path.join(ORCH_SESSIONS_RECORDINGS_DIR, `${sessionId}.wav`));
      const hasInputCopy = fs.existsSync(path.join(ORCH_ASR_INPUT_DIR, `${sessionId}.wav`));
      const hasTranscript = fs.existsSync(path.join(ORCH_ASR_TRANSCRIPTS_DIR, `asr_transcript_${sessionId}.md`));
      const hasStaged = fs.existsSync(path.join(ORCH_ASR_STAGED_DIR, `asr_command_packet_${sessionId}.md`));
      const hasApproved = fs.existsSync(path.join(ORCH_ASR_APPROVED_DIR, `asr_command_packet_${sessionId}.md`));
      const hasRejected = fs.existsSync(path.join(process.cwd(), `outputs/narrator/asr/rejected/asr_command_packet_${sessionId}.md`));
      const hasExecuted = fs.existsSync(path.join(ORCH_BRIDGE_EXECUTED_DIR, `asr_command_packet_${sessionId}.md`));

      let state = 'Recorded';
      if (hasExecuted) state = 'Executed';
      else if (hasApproved) state = 'ASR Approved';
      else if (hasRejected) state = 'Rejected';
      else if (hasStaged) state = 'Command Staged';
      else if (hasTranscript) state = 'Transcribed';
      else if (hasInputCopy) state = 'Staged for ASR';

      console.log(`- Session ID: ${sessionId}`);
      console.log(`  Audio: ${hasAudio ? '✅' : '❌'} | Dispatch: ${hasInputCopy ? '✅' : '⏳'} | Transcript: ${hasTranscript ? '✅' : '⏳'} | Staged Cmd: ${hasStaged ? '✅' : '⏳'} | Approved: ${hasApproved ? '✅' : hasRejected ? '❌ (REJECTED)' : '⏳'} | Executed: ${hasExecuted ? '✅' : '⏳'}`);
      console.log(`  Current State: [${state}]\n`);
    } catch (e) {}
  });

  console.log('========================================================================\n');
}

// ─── Session Pipeline ────────────────────────────────────────────────────────
function handleSessionPipeline(sessionId: string) {
  ensureDirs();
  const jsonPath = path.join(ORCH_SESSIONS_METADATA_DIR, `${sessionId}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Error: Voice session metadata file not found for "${sessionId}".`);
    process.exit(1);
  }

  let meta: SessionMetadata;
  try {
    meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Error: Metadata file is corrupted.`);
    process.exit(1);
  }

  const hasInputCopy = fs.existsSync(path.join(ORCH_ASR_INPUT_DIR, `${sessionId}.wav`));
  const hasTranscript = fs.existsSync(path.join(ORCH_ASR_TRANSCRIPTS_DIR, `asr_transcript_${sessionId}.md`));
  const hasStaged = fs.existsSync(path.join(ORCH_ASR_STAGED_DIR, `asr_command_packet_${sessionId}.md`));
  const hasApproved = fs.existsSync(path.join(ORCH_ASR_APPROVED_DIR, `asr_command_packet_${sessionId}.md`));
  const hasRejected = fs.existsSync(path.join(process.cwd(), `outputs/narrator/asr/rejected/asr_command_packet_${sessionId}.md`));
  const hasReady = fs.existsSync(path.join(ORCH_BRIDGE_READY_DIR, `asr_command_packet_${sessionId}.md`));
  const hasExecuted = fs.existsSync(path.join(ORCH_BRIDGE_EXECUTED_DIR, `asr_command_packet_${sessionId}.md`));

  const template = loadTemplate('voice-asr-session-pipeline-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{SESSION_ID}}/g, meta.id)
    .replace(/{{SESSION_NAME}}/g, meta.name)
    .replace(/{{AUDIO_PATH}}/g, meta.audioPath)
    .replace(/{{DURATION_SECONDS}}/g, String(meta.durationSeconds))
    .replace(/{{RECORDING_STATUS}}/g, meta.status)
    .replace(/{{ASR_DISPATCHED_STATE}}/g, hasInputCopy ? 'x' : ' ')
    .replace(/{{ASR_INPUT_PATH}}/g, hasInputCopy ? path.join(ORCH_ASR_INPUT_DIR, `${sessionId}.wav`) : 'Not staged')
    .replace(/{{ASR_TRANSCRIBED_STATE}}/g, hasTranscript ? 'x' : ' ')
    .replace(/{{ASR_TRANSCRIPT_PATH}}/g, hasTranscript ? path.join(ORCH_ASR_TRANSCRIPTS_DIR, `asr_transcript_${sessionId}.md`) : 'Not transcribed')
    .replace(/{{ASR_STAGED_STATE}}/g, hasStaged ? 'x' : ' ')
    .replace(/{{ASR_STAGED_PATH}}/g, hasStaged ? path.join(ORCH_ASR_STAGED_DIR, `asr_command_packet_${sessionId}.md`) : 'Not staged')
    .replace(/{{ASR_APPROVED_STATE}}/g, hasApproved ? 'x' : hasRejected ? 'Rejected' : ' ')
    .replace(/{{ASR_APPROVED_PATH}}/g, hasApproved ? path.join(ORCH_ASR_APPROVED_DIR, `asr_command_packet_${sessionId}.md`) : hasRejected ? 'Rejected' : 'Not approved')
    .replace(/{{BRIDGE_READY}}/g, hasReady ? 'Yes' : 'No')
    .replace(/{{BRIDGE_EXECUTED}}/g, hasExecuted ? 'Yes' : 'No')
    .replace(/{{EXECUTION_STATUS}}/g, hasExecuted ? 'Executed Successfully' : 'Not Executed');

  console.log(output);
}

// ─── Dispatch ASR ────────────────────────────────────────────────────────────
function handleDispatchAsr(sessionId: string) {
  ensureDirs();
  const wavPath = path.join(ORCH_SESSIONS_RECORDINGS_DIR, `${sessionId}.wav`);
  if (!fs.existsSync(wavPath)) {
    console.error(`❌ Error: WAV audio file not found for session "${sessionId}".`);
    process.exit(1);
  }

  // Security Check: Is archived or rejected?
  const jsonPath = path.join(ORCH_SESSIONS_METADATA_DIR, `${sessionId}.json`);
  if (fs.existsSync(jsonPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (meta.rejected) {
        console.error('❌ Error: Refusing dispatch. Session recording is rejected.');
        process.exit(1);
      }
      if (meta.archived) {
        console.error('❌ Error: Refusing dispatch. Session recording is archived.');
        process.exit(1);
      }
    } catch (e) {}
  }

  const targetPath = path.join(ORCH_ASR_INPUT_DIR, `${sessionId}.wav`);
  const duplicateExists = fs.existsSync(targetPath);

  if (duplicateExists && DUPLICATE_DISPATCH_PROTECTION) {
    console.log(`[INFO] Audio file is already dispatched to ASR intake. Dispatch block active.`);
  } else {
    fs.copyFileSync(wavPath, targetPath);
    console.log(`✅ Copy complete. Dispatched audio file to: ${targetPath}`);
  }

  // Update session metadata status
  if (fs.existsSync(jsonPath)) {
    try {
      const meta: SessionMetadata = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      meta.stagedForAsr = true;
      meta.stagedAt = new Date().toISOString();
      meta.status = 'staged_for_asr';
      fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), 'utf-8');

      // Update MD as well if template is loaded
      const template = fs.readFileSync(jsonPath.replace('.json', '.md'), 'utf-8');
      const updatedMd = template
        .replace(/Status:\s*`[^`]+`/i, 'Status: `staged_for_asr`')
        .replace(/Staged for ASR:\s*`[^`]+`/i, 'Staged for ASR: `true`')
        .replace(/Staged Timestamp:\s*`[^`]+`/i, `Staged Timestamp: \`${meta.stagedAt}\``);
      fs.writeFileSync(jsonPath.replace('.json', '.md'), updatedMd, 'utf-8');
    } catch (e) {}
  }

  const template = loadTemplate('voice-asr-dispatch-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{SESSION_ID}}/g, sessionId)
    .replace(/{{SOURCE_AUDIO}}/g, wavPath)
    .replace(/{{TARGET_AUDIO}}/g, targetPath)
    .replace(/{{DISPATCH_OUTCOME}}/g, duplicateExists ? 'DUPLICATE_BLOCKED' : 'DISPATCHED')
    .replace(/{{STATUS_CODE}}/g, '0')
    .replace(/{{ERROR_MESSAGE}}/g, duplicateExists ? 'File was already copied. Duplicate action blocked.' : 'None');

  console.log(output);
  logEvent(`DISPATCH_ASR | ID: ${sessionId} | Success: true`);
}

// ─── Transcribe Session ──────────────────────────────────────────────────────
function handleTranscribeSession(sessionId: string) {
  ensureDirs();
  const inputAudioPath = path.join(ORCH_ASR_INPUT_DIR, `${sessionId}.wav`);
  if (!fs.existsSync(inputAudioPath)) {
    console.error(`❌ Error: Session audio not found in ASR input queue. Run dispatch-asr first.`);
    process.exit(1);
  }

  console.log(`[INFO] Delegating transcription request for ID "${sessionId}" to ASR listener...`);
  try {
    const cmd = `npm run narrator-asr-listener -- transcribe "${path.relative(process.cwd(), inputAudioPath)}"`;
    execSync(cmd, { stdio: 'inherit' });

    // Read generated transcript
    const transcriptPath = path.join(ORCH_ASR_TRANSCRIPTS_DIR, `asr_transcript_${sessionId}.md`);
    let transcriptText = 'None';
    if (fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf-8');
      const textMatch = content.match(/```text\s*([\s\S]*?)\s*```/i);
      if (textMatch) transcriptText = textMatch[1].trim();
    }

    const template = loadTemplate('voice-asr-transcription-template');
    const output = template
      .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
      .replace(/{{SESSION_ID}}/g, sessionId)
      .replace(/{{AUDIO_SOURCE}}/g, inputAudioPath)
      .replace(/{{TRANSCRIPT_PATH}}/g, transcriptPath)
      .replace(/{{TRANSCRIPT_TEXT}}/g, transcriptText);

    console.log('\n=========================================');
    console.log('📝 Transcription Dispatch Finished');
    console.log('=========================================');
    console.log(output);

    logEvent(`TRANSCRIBE_SESSION | ID: ${sessionId} | Outcomes: SUCCESS`);
  } catch (err) {
    console.error(`❌ Transcription delegation failed.`);
    process.exit(1);
  }
}

// ─── Stage Transcript ────────────────────────────────────────────────────────
function handleStageTranscript(sessionId: string) {
  ensureDirs();
  const transcriptPath = path.join(ORCH_ASR_TRANSCRIPTS_DIR, `asr_transcript_${sessionId}.md`);
  if (!fs.existsSync(transcriptPath)) {
    console.error(`❌ Error: Raw transcript file is missing at expected path: ${transcriptPath}`);
    process.exit(1);
  }

  console.log(`[INFO] Delegating command staging for ID "${sessionId}" to ASR listener...`);
  try {
    const cmd = `npm run narrator-asr-listener -- stage-command "${sessionId}"`;
    execSync(cmd, { stdio: 'inherit' });
    logEvent(`STAGE_TRANSCRIPT | ID: ${sessionId} | Outcomes: SUCCESS`);
  } catch (err) {
    console.error(`❌ Command staging delegation failed.`);
    process.exit(1);
  }
}

// ─── Review Session ──────────────────────────────────────────────────────────
function handleReviewSession(sessionId: string) {
  ensureDirs();
  const stagedPath = path.join(ORCH_ASR_STAGED_DIR, `asr_command_packet_${sessionId}.md`);
  if (!fs.existsSync(stagedPath)) {
    console.error(`❌ Error: Staged packet not found for review: ${stagedPath}`);
    process.exit(1);
  }

  console.log(`[INFO] Delegating command review for ID "${sessionId}" to ASR listener...`);
  try {
    const cmd = `npm run narrator-asr-listener -- review "${sessionId}"`;
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Command review delegation failed.`);
    process.exit(1);
  }
}

// ─── Approve Command ──────────────────────────────────────────────────────────
function handleApproveCommand(sessionId: string) {
  ensureDirs();
  const stagedPath = path.join(ORCH_ASR_STAGED_DIR, `asr_command_packet_${sessionId}.md`);
  if (!fs.existsSync(stagedPath)) {
    console.error(`❌ Error: Refusing approval. Staged command packet is missing: ${stagedPath}`);
    process.exit(1);
  }

  console.log(`[INFO] Delegating ASR approval for ID "${sessionId}" to ASR listener...`);
  try {
    const cmd = `npm run narrator-asr-listener -- approve "${sessionId}"`;
    execSync(cmd, { stdio: 'inherit' });
    logEvent(`APPROVE_SESSION_COMMAND | ID: ${sessionId} | Outcomes: SUCCESS`);
  } catch (err) {
    console.error(`❌ Approval delegation failed.`);
    process.exit(1);
  }
}

// ─── Reject Command ──────────────────────────────────────────────────────────
function handleRejectCommand(sessionId: string) {
  ensureDirs();
  console.log(`[INFO] Delegating ASR rejection for ID "${sessionId}" to ASR listener...`);
  try {
    const cmd = `npm run narrator-asr-listener -- reject "${sessionId}"`;
    execSync(cmd, { stdio: 'inherit' });
    logEvent(`REJECT_SESSION_COMMAND | ID: ${sessionId} | Outcomes: SUCCESS`);
  } catch (err) {
    console.error(`❌ Rejection delegation failed.`);
    process.exit(1);
  }
}

// ─── Pipeline Status ─────────────────────────────────────────────────────────
function handlePipelineStatus() {
  ensureDirs();
  const getCount = (dir: string) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.wav')).length;
  };

  const template = loadTemplate('voice-asr-pipeline-summary-template');
  const output = template
    .replace(/{{TIMESTAMP}}/g, new Date().toISOString())
    .replace(/{{DISPATCHED_ASR_COUNT}}/g, String(getCount(ORCH_ASR_INPUT_DIR)))
    .replace(/{{TRANSCRIBED_COUNT}}/g, String(getCount(ORCH_ASR_TRANSCRIPTS_DIR)))
    .replace(/{{STAGED_COUNT}}/g, String(getCount(ORCH_ASR_STAGED_DIR)))
    .replace(/{{APPROVED_COUNT}}/g, String(getCount(ORCH_ASR_APPROVED_DIR)))
    .replace(/{{AUTO_TRANSCRIBE}}/g, String(AUTO_TRANSCRIBE_AFTER_SESSION))
    .replace(/{{AUTO_STAGE}}/g, String(AUTO_STAGE_COMMAND_AFTER_TRANSCRIPT))
    .replace(/{{AUTO_APPROVE}}/g, String(AUTO_APPROVE_TRANSCRIPT))
    .replace(/{{DUPLICATE_PROTECTION}}/g, String(DUPLICATE_DISPATCH_PROTECTION))
    .replace(/{{RECORDINGS_DIR}}/g, ORCH_SESSIONS_RECORDINGS_DIR)
    .replace(/{{ASR_INPUT_DIR}}/g, ORCH_ASR_INPUT_DIR)
    .replace(/{{ASR_TRANSCRIPTS_DIR}}/g, ORCH_ASR_TRANSCRIPTS_DIR)
    .replace(/{{ASR_STAGED_DIR}}/g, ORCH_ASR_STAGED_DIR);

  console.log(output);

  // Write log summary report
  const filename = `voice_asr_pipeline_telemetry_report_${getTimestampStr(new Date())}.md`;
  fs.writeFileSync(path.join(ORCH_REPORTS_DIR, filename), output, 'utf-8');
}

// ─── Latest Pipeline ─────────────────────────────────────────────────────────
function handleLatestPipeline() {
  ensureDirs();
  if (!fs.existsSync(ORCH_SESSIONS_METADATA_DIR)) {
    console.log('No metadata records found.');
    return;
  }

  const files = fs.readdirSync(ORCH_SESSIONS_METADATA_DIR).filter(f => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.log('No voice recording sessions found.');
    return;
  }

  const latestFile = files[files.length - 1];
  const sessionId = latestFile.replace('.json', '');
  handleSessionPipeline(sessionId);
}

// ─── Orchestrator Log ────────────────────────────────────────────────────────
function handleOrchestratorLog() {
  ensureDirs();
  const logFilePath = path.join(ORCH_LOGS_DIR, 'orchestrator.log');
  let logLines = 'No orchestrator events recorded.';

  if (fs.existsSync(logFilePath)) {
    logLines = fs.readFileSync(logFilePath, 'utf-8');
  }

  console.log('\n=========================================');
  console.log('🧾 Local Orchestrator Log Stream');
  console.log('=========================================');
  console.log(logLines);
  console.log('=========================================\n');
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
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
    'scan-sessions',
    'session-pipeline',
    'dispatch-asr',
    'transcribe-session',
    'stage-transcript',
    'review-session',
    'approve-session-command',
    'reject-session-command',
    'pipeline-status',
    'latest-pipeline',
    'orchestrator-log'
  ];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown orchestrator command: "${command}". Run "npm run narrator-voice-asr-orchestrator-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-asr-orchestrator-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
  } else if (command === 'scan-sessions') {
    handleScanSessions();
  } else if (command === 'session-pipeline') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleSessionPipeline(target);
  } else if (command === 'dispatch-asr') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleDispatchAsr(target);
  } else if (command === 'transcribe-session') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleTranscribeSession(target);
  } else if (command === 'stage-transcript') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleStageTranscript(target);
  } else if (command === 'review-session') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleReviewSession(target);
  } else if (command === 'approve-session-command') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleApproveCommand(target);
  } else if (command === 'reject-session-command') {
    if (!target) {
      console.error('[ERR] Please specify a session ID.');
      process.exit(1);
    }
    handleRejectCommand(target);
  } else if (command === 'pipeline-status') {
    handlePipelineStatus();
  } else if (command === 'latest-pipeline') {
    handleLatestPipeline();
  } else if (command === 'orchestrator-log') {
    handleOrchestratorLog();
  }
}

main();
