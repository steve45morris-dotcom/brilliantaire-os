import * as fs from 'fs';
import * as path from 'path';
import {
  TTS_QUEUE_ROOT,
  RENDER_REQUEST_DIR,
  APPROVED_DIR,
  REJECTED_DIR,
  RENDERED_AUDIO_DIR,
  LOG_DIR,
  LATEST_VOICE_PACKET_DIR,
  LATEST_VNP_QUEUE_DIR,
  ALLOW_EXTERNAL_TTS_API,
  ALLOW_AUDIO_PLAYBACK,
  ALLOW_COMMAND_EXECUTION,
  OUTPUT_ONLY_MODE,
  MAX_TTS_TEXT_LENGTH,
  DEFAULT_VOICE_PROFILE,
  DEFAULT_RENDER_FORMAT
} from '../config/narrator-tts-queue.js';

// Helper to pad numbers
const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date, includeSeconds = false): string {
  const base = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return includeSeconds ? `${base}${pad(now.getSeconds())}` : base;
}

function getLatestFile(dirPath: string): string | null {
  if (!fs.existsSync(dirPath)) return null;
  try {
    const files = fs.readdirSync(dirPath);
    let latestFile: string | null = null;
    let latestMtime = 0;
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        latestFile = fullPath;
      }
    }
    return latestFile;
  } catch (e) {
    return null;
  }
}

// Extract content under a markdown header (case-insensitive)
function extractSection(content: string, headerName: string): string {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith('## ') || line.trim().startsWith('# ')) {
      if (inSection) {
        break; // Met another header, stop
      }
      if (line.toLowerCase().includes(headerName.toLowerCase())) {
        inSection = true;
        continue;
      }
    }
    if (inSection) {
      sectionLines.push(line);
    }
  }
  return sectionLines.join('\n').trim();
}

function getFilesCount(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  try {
    return fs.readdirSync(dirPath).filter(f => !f.startsWith('.')).length;
  } catch (e) {
    return 0;
  }
}

function findRequestFile(reqId: string): string | null {
  if (!fs.existsSync(RENDER_REQUEST_DIR)) return null;
  try {
    const files = fs.readdirSync(RENDER_REQUEST_DIR);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const filePath = path.join(RENDER_REQUEST_DIR, file);
      if (file.includes(reqId)) {
        return filePath;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(reqId)) {
        return filePath;
      }
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

function writeOperationLog(command: string, reqId: string, filesRead: string[], filesWritten: string[], result: string) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const logTemplatePath = path.resolve(process.cwd(), 'templates/narrator_tts_queue/render-log-template.md');
    let template = '';
    if (fs.existsSync(logTemplatePath)) {
      template = fs.readFileSync(logTemplatePath, 'utf-8');
    } else {
      template = `# Render Log\nTimestamp: {{TIMESTAMP}}\nCommand: {{COMMAND}}\nRequest ID: {{REQUEST_ID}}\nFiles Read: {{FILES_READ}}\nFiles Written: {{FILES_WRITTEN}}\nResult: {{RESULT}}\nSafety Mode: {{SAFETY_MODE}}`;
    }

    const now = new Date();
    const formattedRead = filesRead.map(f => `- ${path.basename(f)}`).join('\n') || 'None';
    const formattedWritten = filesWritten.map(f => `- ${path.basename(f)}`).join('\n') || 'None';

    const output = template
      .replace(/{{TIMESTAMP}}/g, now.toISOString())
      .replace(/{{COMMAND}}/g, command)
      .replace(/{{REQUEST_ID}}/g, reqId)
      .replace(/{{FILES_READ}}/g, formattedRead)
      .replace(/{{FILES_WRITTEN}}/g, formattedWritten)
      .replace(/{{RESULT}}/g, result)
      .replace(/{{SAFETY_MODE}}/g, OUTPUT_ONLY_MODE ? 'output_only' : 'restricted');

    const logFilename = `tts_render_log_${getTimestampStr(now, true)}.md`;
    fs.writeFileSync(path.join(LOG_DIR, logFilename), output, 'utf-8');
  } catch (e) {
    console.error('[ERR] Failed to write operations log:', e);
  }
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handleRequest(timestampStr: string): { success: boolean; reqId?: string; filePath?: string; error?: string; filesRead: string[] } {
  fs.mkdirSync(RENDER_REQUEST_DIR, { recursive: true });

  const latestPacket = getLatestFile(LATEST_VOICE_PACKET_DIR);
  const latestVnp = getLatestFile(LATEST_VNP_QUEUE_DIR);

  if (!latestPacket) {
    return { success: false, error: 'No voice packet files found.', filesRead: [] };
  }

  const packetContent = fs.readFileSync(latestPacket, 'utf-8');
  let voiceScript = extractSection(packetContent, 'Voice Script');

  if (!voiceScript) {
    // If packet template was modified or section not found, fallback to reading the entire text
    voiceScript = packetContent;
  }

  if (voiceScript.length > MAX_TTS_TEXT_LENGTH) {
    voiceScript = voiceScript.substring(0, MAX_TTS_TEXT_LENGTH) + '\n\n[TRUNCATED BY TTS QUEUE SAFETY LIMIT]';
  }

  const templatePath = path.resolve(process.cwd(), 'templates/narrator_tts_queue/render-request-template.md');
  if (!fs.existsSync(templatePath)) {
    return { success: false, error: `Render request template not found at: ${templatePath}`, filesRead: [latestPacket] };
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  const reqId = `tts_req_${timestampStr}`;

  const rendered = template
    .replace(/{{REQUEST_ID}}/g, reqId)
    .replace(/{{SOURCE_VOICE_PACKET}}/g, path.basename(latestPacket))
    .replace(/{{SOURCE_VNP_QUEUE}}/g, latestVnp ? path.basename(latestVnp) : 'none')
    .replace(/{{VOICE_PROFILE}}/g, DEFAULT_VOICE_PROFILE)
    .replace(/{{RENDER_FORMAT}}/g, DEFAULT_RENDER_FORMAT)
    .replace(/{{SAFETY_MODE}}/g, OUTPUT_ONLY_MODE ? 'output_only' : 'restricted')
    .replace(/{{EXTERNAL_TTS_ALLOWED}}/g, String(ALLOW_EXTERNAL_TTS_API))
    .replace(/{{AUDIO_PLAYBACK_ALLOWED}}/g, String(ALLOW_AUDIO_PLAYBACK))
    .replace(/{{STATUS}}/g, 'pending_manual_approval')
    .replace(/{{TEXT_TO_RENDER}}/g, voiceScript);

  const outPath = path.join(RENDER_REQUEST_DIR, `tts_render_request_${timestampStr}.md`);
  fs.writeFileSync(outPath, rendered, 'utf-8');

  console.log(`[OK] TTS Render Request enqueued: ${outPath} (ID: ${reqId})`);

  const readFiles = [latestPacket];
  if (latestVnp) readFiles.push(latestVnp);

  return { success: true, reqId, filePath: outPath, filesRead: readFiles };
}

function handleApprove(reqId: string): { success: boolean; filePath?: string; error?: string; filesRead: string[] } {
  fs.mkdirSync(APPROVED_DIR, { recursive: true });

  const targetFile = findRequestFile(reqId);
  if (!targetFile) {
    return { success: false, error: `Staged render request matching ID "${reqId}" not found.`, filesRead: [] };
  }

  let content = fs.readFileSync(targetFile, 'utf-8');
  // Update status in content
  content = content.replace('pending_manual_approval', 'approved_for_manual_tts_render');

  const destPath = path.join(APPROVED_DIR, path.basename(targetFile));
  fs.writeFileSync(destPath, content, 'utf-8');

  // Remove from pending queue (move)
  try {
    fs.unlinkSync(targetFile);
  } catch (e) {
    // Ignore error
  }

  console.log(`[OK] TTS Render Request approved and moved to: ${destPath}`);
  return { success: true, filePath: destPath, filesRead: [targetFile] };
}

function handleReject(reqId: string): { success: boolean; filePath?: string; error?: string; filesRead: string[] } {
  fs.mkdirSync(REJECTED_DIR, { recursive: true });

  const targetFile = findRequestFile(reqId);
  if (!targetFile) {
    return { success: false, error: `Staged render request matching ID "${reqId}" not found.`, filesRead: [] };
  }

  let content = fs.readFileSync(targetFile, 'utf-8');
  // Update status in content
  content = content.replace('pending_manual_approval', 'rejected');

  const destPath = path.join(REJECTED_DIR, path.basename(targetFile));
  fs.writeFileSync(destPath, content, 'utf-8');

  // Remove from pending queue (move)
  try {
    fs.unlinkSync(targetFile);
  } catch (e) {
    // Ignore error
  }

  console.log(`[OK] TTS Render Request rejected and moved to: ${destPath}`);
  return { success: true, filePath: destPath, filesRead: [targetFile] };
}

function handleStatus() {
  const latestPacket = getLatestFile(LATEST_VOICE_PACKET_DIR);
  const latestVnp = getLatestFile(LATEST_VNP_QUEUE_DIR);

  const pendingCount = getFilesCount(RENDER_REQUEST_DIR);
  const approvedCount = getFilesCount(APPROVED_DIR);
  const rejectedCount = getFilesCount(REJECTED_DIR);
  const renderedCount = getFilesCount(RENDERED_AUDIO_DIR);

  const queueStatus = pendingCount > 0 ? 'ACTIVE_PENDING_APPROVAL' : 'IDLE';

  console.log('\n=========================================');
  console.log('📡 AI TTS Render Queue Status Report');
  console.log('=========================================');
  console.log(`Latest Voice Packet Exists : ${latestPacket ? 'YES' : 'NO'}`);
  console.log(`Latest VNP Queue Exists    : ${latestVnp ? 'YES' : 'NO'}`);
  console.log(`Queue Operational Status   : ${queueStatus}`);
  console.log(`-----------------------------------------`);
  console.log(`Pending Render Requests   : ${pendingCount}`);
  console.log(`Approved Requests Count    : ${approvedCount}`);
  console.log(`Rejected Requests Count    : ${rejectedCount}`);
  console.log(`Rendered Audio Files       : ${renderedCount}`);
  console.log(`-----------------------------------------`);
  console.log(`🔒 Safety Configuration Controls:`);
  console.log(`  - External TTS API Calls Allowed       : ${ALLOW_EXTERNAL_TTS_API}`);
  console.log(`  - Direct Audio Playback Allowed        : ${ALLOW_AUDIO_PLAYBACK}`);
  console.log(`  - Subprocess Command Execution Allowed : ${ALLOW_COMMAND_EXECUTION}`);
  console.log(`  - Output-Only Mode (Sandbox)          : ${OUTPUT_ONLY_MODE}`);
  console.log(`  - Default Voice Profile Selection      : "${DEFAULT_VOICE_PROFILE}"`);
  console.log(`  - Preferred Output Audio Format        : "${DEFAULT_RENDER_FORMAT}"`);
  console.log(`-----------------------------------------`);
  console.log(`Next Recommended Action: ${pendingCount > 0 ? 'Review and approve pending render requests manually.' : 'Execute request command to stage new packets.'}`);
  console.log('=========================================\n');
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const commandInput = args[0] ? args[0].trim() : 'help';

  // Check if first arg is composed, e.g. "approve tts_req_2026-05-31_0712"
  const tokens = commandInput.split(/\s+/);
  const command = tokens[0].toLowerCase();
  const targetId = tokens[1] || '';

  const validCommands = ['help', 'request', 'approve', 'reject', 'status', 'all'];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-tts-queue-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-tts-queue-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
    return;
  }

  const now = new Date();
  const timestampStr = getTimestampStr(now);

  if (command === 'request') {
    const res = handleRequest(timestampStr);
    if (res.success && res.reqId && res.filePath) {
      writeOperationLog('request', res.reqId, res.filesRead, [res.filePath], 'SUCCESS');
    } else {
      console.error(`[ERR] Failed to stage request: ${res.error}`);
      writeOperationLog('request', 'none', res.filesRead, [], `FAILED: ${res.error}`);
      process.exit(1);
    }
    return;
  }

  if (command === 'approve') {
    if (!targetId) {
      console.error('[ERR] Please specify a request ID to approve (e.g. approve tts_req_YYYY-MM-DD_HHMM).');
      process.exit(1);
    }
    const res = handleApprove(targetId);
    if (res.success && res.filePath) {
      writeOperationLog('approve', targetId, res.filesRead, [res.filePath], 'SUCCESS');
    } else {
      console.error(`[ERR] Failed to approve request: ${res.error}`);
      writeOperationLog('approve', targetId, res.filesRead, [], `FAILED: ${res.error}`);
      process.exit(1);
    }
    return;
  }

  if (command === 'reject') {
    if (!targetId) {
      console.error('[ERR] Please specify a request ID to reject (e.g. reject tts_req_YYYY-MM-DD_HHMM).');
      process.exit(1);
    }
    const res = handleReject(targetId);
    if (res.success && res.filePath) {
      writeOperationLog('reject', targetId, res.filesRead, [res.filePath], 'SUCCESS');
    } else {
      console.error(`[ERR] Failed to reject request: ${res.error}`);
      writeOperationLog('reject', targetId, res.filesRead, [], `FAILED: ${res.error}`);
      process.exit(1);
    }
    return;
  }

  if (command === 'all') {
    console.log('\n[INFO] Staging a new TTS render request from latest telemetry voice sync files...');
    const res = handleRequest(timestampStr);
    if (res.success && res.reqId && res.filePath) {
      writeOperationLog('request-via-all', res.reqId, res.filesRead, [res.filePath], 'SUCCESS');
    } else {
      console.error(`[ERR] Failed to stage request: ${res.error}`);
    }
    handleStatus();
  }
}

main();
