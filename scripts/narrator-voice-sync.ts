import * as fs from 'fs';
import * as path from 'path';
import {
  VOICE_SYNC_OUTPUT_DIR,
  VOICE_PACKET_DIR,
  VNP_QUEUE_DIR,
  VOICE_SYNC_LOG_DIR,
  LATEST_VOICE_SCRIPT_DIR,
  LIVE_FEED_PATH,
  ALLOW_COMMAND_EXECUTION,
  ALLOW_TTS_API_CALLS,
  ALLOW_BACKGROUND_AUTOMATION,
  OUTPUT_ONLY_MODE,
  MAX_VOICE_SCRIPT_LENGTH
} from '../config/narrator-voice-sync.js';

// Fallback card path
const NARRATOR_CARD_PATH = path.resolve(process.cwd(), 'outputs/narrator_card.json');

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

function loadLiveFeed(): any {
  if (fs.existsSync(LIVE_FEED_PATH)) {
    try {
      const content = fs.readFileSync(LIVE_FEED_PATH, 'utf-8');
      return { data: JSON.parse(content), source: LIVE_FEED_PATH };
    } catch (e) {
      // Fallback
    }
  }
  if (fs.existsSync(NARRATOR_CARD_PATH)) {
    try {
      const content = fs.readFileSync(NARRATOR_CARD_PATH, 'utf-8');
      return { data: JSON.parse(content), source: NARRATOR_CARD_PATH };
    } catch (e) {
      // Fallback
    }
  }
  return {
    data: {
      headline: 'System Status Unresolved',
      mood: 'unknown',
      status_color: 'gray',
      safety_mode: 'output_only'
    },
    source: 'none'
  };
}

function writeSyncLog(command: string, filesRead: string[], filesWritten: string[], result: string) {
  try {
    fs.mkdirSync(VOICE_SYNC_LOG_DIR, { recursive: true });
    const logTemplatePath = path.resolve(process.cwd(), 'templates/narrator_voice_sync/voice-sync-log-template.md');
    let template = '';
    if (fs.existsSync(logTemplatePath)) {
      template = fs.readFileSync(logTemplatePath, 'utf-8');
    } else {
      template = `# Sync Log\nSync Date: {{SYNC_DATE}}\nCommand: {{COMMAND}}\nFiles Read: {{FILES_READ}}\nFiles Written: {{FILES_WRITTEN}}\nSafety Mode: {{SAFETY_MODE}}\nResult: {{RESULT}}`;
    }

    const now = new Date();
    const formattedRead = filesRead.map(f => `- ${path.basename(f)}`).join('\n') || 'None';
    const formattedWritten = filesWritten.map(f => `- ${path.basename(f)}`).join('\n') || 'None';

    const output = template
      .replace(/{{SYNC_DATE}}/g, now.toISOString())
      .replace(/{{COMMAND}}/g, command)
      .replace(/{{FILES_READ}}/g, formattedRead)
      .replace(/{{FILES_WRITTEN}}/g, formattedWritten)
      .replace(/{{SAFETY_MODE}}/g, OUTPUT_ONLY_MODE ? 'output_only' : 'restricted')
      .replace(/{{RESULT}}/g, result);

    const logFilename = `voice_sync_log_${getTimestampStr(now, true)}.md`;
    fs.writeFileSync(path.join(VOICE_SYNC_LOG_DIR, logFilename), output, 'utf-8');
  } catch (e) {
    console.error('[ERR] Failed to write sync log:', e);
  }
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handlePacket(timestampStr: string): { success: boolean; filePath?: string; error?: string; filesRead: string[] } {
  fs.mkdirSync(VOICE_PACKET_DIR, { recursive: true });

  const latestVoiceFile = getLatestFile(LATEST_VOICE_SCRIPT_DIR);
  if (!latestVoiceFile) {
    return { success: false, error: 'No voice script files found in directory.', filesRead: [] };
  }

  let voiceScript = fs.readFileSync(latestVoiceFile, 'utf-8');
  if (voiceScript.length > MAX_VOICE_SCRIPT_LENGTH) {
    voiceScript = voiceScript.substring(0, MAX_VOICE_SCRIPT_LENGTH) + '\n\n[TRUNCATED BY VOICE SYNC SAFETY LIMIT]';
  }

  const { data: feedData, source: feedSource } = loadLiveFeed();

  const packetTemplatePath = path.resolve(process.cwd(), 'templates/narrator_voice_sync/voice-packet-template.md');
  if (!fs.existsSync(packetTemplatePath)) {
    return { success: false, error: `Voice packet template not found at: ${packetTemplatePath}`, filesRead: [latestVoiceFile, feedSource] };
  }

  const template = fs.readFileSync(packetTemplatePath, 'utf-8');
  const now = new Date();

  const rendered = template
    .replace(/{{GENERATED_AT}}/g, now.toISOString())
    .replace(/{{HEADLINE}}/g, feedData.headline || 'No headline available')
    .replace(/{{MOOD}}/g, feedData.mood || 'unknown')
    .replace(/{{STATUS_COLOR}}/g, feedData.status_color || 'gray')
    .replace(/{{VOICE_SCRIPT}}/g, voiceScript)
    .replace(/{{SOURCE_VOICE_SCRIPT}}/g, path.basename(latestVoiceFile))
    .replace(/{{SOURCE_LIVE_FEED}}/g, path.basename(feedSource))
    .replace(/{{SAFETY_MODE}}/g, OUTPUT_ONLY_MODE ? 'output_only' : 'restricted')
    .replace(/{{PLAYBACK_STATUS}}/g, 'manual_review_required');

  const outPath = path.join(VOICE_PACKET_DIR, `narrator_voice_packet_${timestampStr}.md`);
  fs.writeFileSync(outPath, rendered, 'utf-8');

  console.log(`[OK] Voice Narration Packet compiled: ${outPath}`);
  return { success: true, filePath: outPath, filesRead: [latestVoiceFile, feedSource] };
}

function handleQueue(timestampStr: string): { success: boolean; filePath?: string; error?: string; filesRead: string[] } {
  fs.mkdirSync(VNP_QUEUE_DIR, { recursive: true });

  const latestVoiceFile = getLatestFile(LATEST_VOICE_SCRIPT_DIR);
  if (!latestVoiceFile) {
    return { success: false, error: 'No voice script files found in directory.', filesRead: [] };
  }

  const voiceScript = fs.readFileSync(latestVoiceFile, 'utf-8');

  // Parse fields
  const tacticalIntent = extractSection(voiceScript, 'Tactical Intent') || 'No tactical intent found.';
  const completionLine = extractSection(voiceScript, 'Completion Status') || 'No completion status found.';
  const spokenSummary = extractSection(voiceScript, 'Main Summary') || 'No main summary found.';

  const { data: feedData, source: feedSource } = loadLiveFeed();

  const queueTemplatePath = path.resolve(process.cwd(), 'templates/narrator_voice_sync/vnp-queue-template.md');
  if (!fs.existsSync(queueTemplatePath)) {
    return { success: false, error: `VNP queue template not found at: ${queueTemplatePath}`, filesRead: [latestVoiceFile, feedSource] };
  }

  const template = fs.readFileSync(queueTemplatePath, 'utf-8');
  const now = new Date();

  const rendered = template
    .replace(/{{ENQUEUED_AT}}/g, now.toISOString())
    .replace(/{{TACTICAL_INTENT}}/g, tacticalIntent)
    .replace(/{{COMPLETION_LINE}}/g, completionLine)
    .replace(/{{SPOKEN_SUMMARY}}/g, spokenSummary)
    .replace(/{{VOICE_TONE}}/g, feedData.mood || 'unknown')
    .replace(/{{QUEUE_STATUS}}/g, 'staged_for_manual_voice_bridge')
    .replace(/{{NO_AUTO_PLAYBACK}}/g, 'true');

  const outPath = path.join(VNP_QUEUE_DIR, `vnp_narrator_queue_${timestampStr}.md`);
  fs.writeFileSync(outPath, rendered, 'utf-8');

  console.log(`[OK] VNP Queue staged: ${outPath}`);
  return { success: true, filePath: outPath, filesRead: [latestVoiceFile, feedSource] };
}

function handleStatus() {
  const latestVoiceFile = getLatestFile(LATEST_VOICE_SCRIPT_DIR);
  const voiceScriptExists = latestVoiceFile ? 'YES' : 'NO';
  const liveFeedExists = fs.existsSync(LIVE_FEED_PATH) ? 'YES' : 'NO';

  const latestPacket = getLatestFile(VOICE_PACKET_DIR);
  const latestQueue = getLatestFile(VNP_QUEUE_DIR);

  console.log('\n=========================================');
  console.log('🎙️ AI Voice Narration Sync Status Report');
  console.log('=========================================');
  console.log(`Latest Voice Script Exists : ${voiceScriptExists}`);
  console.log(`Live Feed JSON Exists     : ${liveFeedExists}`);
  console.log(`Latest Compiled Packet     : ${latestPacket ? path.basename(latestPacket) : 'none'}`);
  console.log(`Latest Staged VNP Queue    : ${latestQueue ? path.basename(latestQueue) : 'none'}`);
  console.log('-----------------------------------------');
  console.log('🔒 Safety Configuration Controls:');
  console.log(`  - Subprocess Command Execution Allowed : ${ALLOW_COMMAND_EXECUTION}`);
  console.log(`  - External TTS API Requests Allowed    : ${ALLOW_TTS_API_CALLS}`);
  console.log(`  - Background Automation Allowed       : ${ALLOW_BACKGROUND_AUTOMATION}`);
  console.log(`  - Output-Only Mode (Sandbox)          : ${OUTPUT_ONLY_MODE}`);
  console.log(`  - Maximum Script Length Limit          : ${MAX_VOICE_SCRIPT_LENGTH} chars`);
  console.log('-----------------------------------------');
  console.log(`Next Recommended Action: ${latestPacket ? 'Review enqueued voice packets manually via the Oracle Voice Bridge.' : 'Execute packet and queue commands.'}`);
  console.log('=========================================\n');
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase().trim() : 'help';

  const validCommands = ['help', 'packet', 'queue', 'status', 'all'];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-voice-sync-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-voice-sync-help" to see available options.');
    return;
  }

  const now = new Date();
  const timestampStr = getTimestampStr(now);

  if (command === 'packet') {
    const res = handlePacket(timestampStr);
    if (res.success && res.filePath) {
      writeSyncLog('packet', res.filesRead, [res.filePath], 'SUCCESS');
    } else {
      console.error(`[ERR] Failed to generate packet: ${res.error}`);
      writeSyncLog('packet', res.filesRead, [], `FAILED: ${res.error}`);
      process.exit(1);
    }
    return;
  }

  if (command === 'queue') {
    const res = handleQueue(timestampStr);
    if (res.success && res.filePath) {
      writeSyncLog('queue', res.filesRead, [res.filePath], 'SUCCESS');
    } else {
      console.error(`[ERR] Failed to generate queue: ${res.error}`);
      writeSyncLog('queue', res.filesRead, [], `FAILED: ${res.error}`);
      process.exit(1);
    }
    return;
  }

  if (command === 'status') {
    handleStatus();
    return;
  }

  if (command === 'all') {
    console.log('\n[INFO] Starting all voice sync processes...');
    const filesRead: string[] = [];
    const filesWritten: string[] = [];

    const packetRes = handlePacket(timestampStr);
    if (packetRes.success && packetRes.filePath) {
      filesRead.push(...packetRes.filesRead);
      filesWritten.push(packetRes.filePath);
    } else {
      console.error(`[ERR] Failed to compile packet: ${packetRes.error}`);
    }

    const queueRes = handleQueue(timestampStr);
    if (queueRes.success && queueRes.filePath) {
      filesRead.push(...queueRes.filesRead);
      filesWritten.push(queueRes.filePath);
    } else {
      console.error(`[ERR] Failed to stage queue: ${queueRes.error}`);
    }

    const uniqueRead = Array.from(new Set(filesRead));
    writeSyncLog('all', uniqueRead, filesWritten, filesWritten.length === 2 ? 'SUCCESS' : 'PARTIAL_SUCCESS');

    handleStatus();
  }
}

main();
