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

// Helper to pad numbers
const pad = (n: number) => String(n).padStart(2, '0');

function getTimestampStr(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
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

function extractSection(content: string, header: string): string {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith(header)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (line.trim().startsWith('##')) {
        break;
      }
      sectionLines.push(line);
    }
  }
  return sectionLines.join('\n').trim();
}

function loadTemplate(templateName: string): string {
  const rootDir = process.cwd();
  const templatePath = path.join(rootDir, 'templates/narrator_voice_sync', templateName);
  if (!fs.existsSync(templatePath)) {
    console.error(`[ERR] Template not found: ${templatePath}`);
    process.exit(1);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

// ─── Core Logic ──────────────────────────────────────────────────────────────

interface SyncContext {
  headline: string;
  mood: string;
  statusColor: string;
  safetyMode: string;
  voiceScriptText: string;
  latestVoiceScriptFile: string;
  latestLiveFeedFile: string;
}

function gatherContext(): SyncContext {
  const rootDir = process.cwd();
  let headline = 'System Operating Status';
  let mood = 'nominal';
  let statusColor = 'green';
  let safetyMode = 'output_only';
  let voiceScriptText = '';
  let latestLiveFeedFile = 'none';

  // Try to load live feed
  if (fs.existsSync(LIVE_FEED_PATH)) {
    try {
      const feed = JSON.parse(fs.readFileSync(LIVE_FEED_PATH, 'utf-8'));
      headline = feed.headline || headline;
      mood = feed.mood || mood;
      statusColor = feed.status_color || statusColor;
      safetyMode = feed.safety_mode || safetyMode;
      latestLiveFeedFile = LIVE_FEED_PATH;
    } catch (e) {
      // ignore
    }
  } else {
    // Try fallback narrator_card.json
    const cardPath = path.join(rootDir, 'outputs/narrator_card.json');
    if (fs.existsSync(cardPath)) {
      try {
        const card = JSON.parse(fs.readFileSync(cardPath, 'utf-8'));
        headline = card.headline || headline;
        mood = card.mood || mood;
        statusColor = card.status_color || statusColor;
        safetyMode = card.safety_mode || safetyMode;
      } catch (e) {
        // ignore
      }
    }
  }

  // Load latest voice script text
  const latestVoiceScript = getLatestFile(LATEST_VOICE_SCRIPT_DIR);
  let latestVoiceScriptFile = 'none';
  if (latestVoiceScript) {
    latestVoiceScriptFile = latestVoiceScript;
    try {
      const scriptContent = fs.readFileSync(latestVoiceScript, 'utf-8');
      const lines = scriptContent.split('\n');
      const filtered = lines.filter(l => !l.startsWith('#') && !l.startsWith('*') && l.trim().length > 0);
      voiceScriptText = filtered.join(' ').substring(0, MAX_VOICE_SCRIPT_LENGTH);
    } catch (e) {
      voiceScriptText = 'Failed to parse voice script file content.';
    }
  } else {
    // Telemetry fallback script construction
    voiceScriptText = `System status is ${statusColor}. General operating mood is ${mood}. Voice script parser staged locally.`;
  }

  return {
    headline,
    mood,
    statusColor,
    safetyMode,
    voiceScriptText,
    latestVoiceScriptFile,
    latestLiveFeedFile
  };
}

function writeSyncLog(command: string, readFiles: string[], writeFiles: string[], now: Date, timestampStr: string) {
  fs.mkdirSync(VOICE_SYNC_LOG_DIR, { recursive: true });
  let template = loadTemplate('voice-sync-log-template.md');

  const filesReadFormatted = readFiles.map(f => `- ${f}`).join('\n') || '- none';
  const filesWrittenFormatted = writeFiles.map(f => `- ${f}`).join('\n') || '- none';

  template = template
    .replace(/{{SYNC_DATE}}/g, now.toISOString())
    .replace(/{{COMMAND}}/g, command)
    .replace(/{{SAFETY_MODE}}/g, OUTPUT_ONLY_MODE ? 'output_only' : 'disabled')
    .replace(/{{RESULT}}/g, 'SUCCESS')
    .replace(/{{FILES_READ}}/g, filesReadFormatted)
    .replace(/{{FILES_WRITTEN}}/g, filesWrittenFormatted);

  const logFile = path.join(VOICE_SYNC_LOG_DIR, `voice_sync_log_${timestampStr}.md`);
  fs.writeFileSync(logFile, template, 'utf-8');
  console.log(`[OK] Synchronization Log generated: ${logFile}`);
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handlePacket(ctx: SyncContext, now: Date, timestampStr: string): string {
  fs.mkdirSync(VOICE_PACKET_DIR, { recursive: true });
  let template = loadTemplate('voice-packet-template.md');

  template = template
    .replace(/{{GENERATED_AT}}/g, now.toISOString())
    .replace(/{{HEADLINE}}/g, ctx.headline)
    .replace(/{{STATUS_COLOR}}/g, ctx.statusColor.toUpperCase())
    .replace(/{{MOOD}}/g, ctx.mood.toUpperCase())
    .replace(/{{SAFETY_MODE}}/g, ctx.safetyMode)
    .replace(/{{PLAYBACK_STATUS}}/g, 'manual_review_required')
    .replace(/{{VOICE_SCRIPT}}/g, ctx.voiceScriptText)
    .replace(/{{SOURCE_VOICE_SCRIPT}}/g, ctx.latestVoiceScriptFile)
    .replace(/{{SOURCE_LIVE_FEED}}/g, ctx.latestLiveFeedFile);

  const outFile = path.join(VOICE_PACKET_DIR, `narrator_voice_packet_${timestampStr}.md`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`[OK] Voice Sync Packet generated: ${outFile}`);
  return outFile;
}

function handleQueue(ctx: SyncContext, now: Date, timestampStr: string): string {
  fs.mkdirSync(VNP_QUEUE_DIR, { recursive: true });
  let template = loadTemplate('vnp-queue-template.md');

  // Parse voice tone from mood
  let voiceTone = 'confident and steady';
  if (ctx.mood === 'nominal') {
    voiceTone = 'calm and professional';
  } else if (ctx.mood === 'caution' || ctx.mood === 'warning') {
    voiceTone = 'serious and clear';
  } else if (ctx.mood === 'advancing') {
    voiceTone = 'sharp, steady, and fast';
  }

  // Attempt to extract specific lines from source script
  let intentLine = ctx.headline;
  let completionLine = `System operations verified as ${ctx.statusColor}.`;
  let spokenSummary = ctx.voiceScriptText;

  if (ctx.latestVoiceScriptFile !== 'none') {
    try {
      const content = fs.readFileSync(ctx.latestVoiceScriptFile, 'utf-8');
      const parsedIntent = extractSection(content, '## Tactical Intent');
      const parsedCompletion = extractSection(content, '## Completion Status');
      const parsedSummary = extractSection(content, '## Main Summary');

      if (parsedIntent) intentLine = parsedIntent;
      if (parsedCompletion) completionLine = parsedCompletion;
      if (parsedSummary) spokenSummary = parsedSummary;
    } catch (e) {
      // ignore, fall back
    }
  }

  template = template
    .replace(/{{GENERATED_AT}}/g, now.toISOString())
    .replace(/{{TACTICAL_INTENT}}/g, intentLine)
    .replace(/{{COMPLETION_LINE}}/g, completionLine)
    .replace(/{{VOICE_TONE}}/g, voiceTone)
    .replace(/{{QUEUE_STATUS}}/g, 'staged_for_manual_voice_bridge')
    .replace(/{{NO_AUTO_PLAYBACK}}/g, 'true')
    .replace(/{{SPOKEN_SUMMARY}}/g, spokenSummary);

  const outFile = path.join(VNP_QUEUE_DIR, `vnp_narrator_queue_${timestampStr}.md`);
  fs.writeFileSync(outFile, template, 'utf-8');
  console.log(`[OK] VNP Queue Packet staged: ${outFile}`);
  return outFile;
}

function handleStatus() {
  const latestVoiceScript = getLatestFile(LATEST_VOICE_SCRIPT_DIR);
  const scriptExists = latestVoiceScript ? 'YES' : 'NO';
  const feedExists = fs.existsSync(LIVE_FEED_PATH) ? 'YES' : 'NO';

  const latestPacket = getLatestFile(VOICE_PACKET_DIR);
  const latestQueue = getLatestFile(VNP_QUEUE_DIR);

  console.log('\n=========================================');
  console.log('🎙️ AI Narrator Voice Sync Diagnostics');
  console.log('=========================================');
  console.log(`Latest Source Voice Script Exists : ${scriptExists}`);
  console.log(`Live Status Ingestion Feed Exists: ${feedExists}`);
  console.log('-----------------------------------------');
  console.log(`Latest Voice Packet File         : ${latestPacket ? path.basename(latestPacket) : 'none'}`);
  console.log(`Latest VNP Queue Staging File    : ${latestQueue ? path.basename(latestQueue) : 'none'}`);
  console.log('-----------------------------------------');
  console.log('🔒 Safety Configuration Controls:');
  console.log(`  - CLI Task Subprocess Exec Allowed: ${ALLOW_COMMAND_EXECUTION}`);
  console.log(`  - Text-To-Speech (TTS) API Calls   : ${ALLOW_TTS_API_CALLS}`);
  console.log(`  - Background Automation Scheduling  : ${ALLOW_BACKGROUND_AUTOMATION}`);
  console.log(`  - Sandbox Output-Only Enforcement   : ${OUTPUT_ONLY_MODE}`);
  console.log('-----------------------------------------');
  console.log(`Next Recommended Action: ${scriptExists === 'NO' ? 'Run narrator-brief all.' : 'Review stagers and push to voice bridge.'}`);
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

  if (command === 'status') {
    handleStatus();
    return;
  }

  const now = new Date();
  const timestampStr = getTimestampStr(now);
  const ctx = gatherContext();

  const readFiles: string[] = [];
  if (ctx.latestLiveFeedFile !== 'none') readFiles.push(ctx.latestLiveFeedFile);
  if (ctx.latestVoiceScriptFile !== 'none') readFiles.push(ctx.latestVoiceScriptFile);

  const writeFiles: string[] = [];

  if (command === 'packet' || command === 'all') {
    const file = handlePacket(ctx, now, timestampStr);
    writeFiles.push(file);
  }
  if (command === 'queue' || command === 'all') {
    const file = handleQueue(ctx, now, timestampStr);
    writeFiles.push(file);
  }

  // Generate logs
  writeSyncLog(command, readFiles, writeFiles, now, timestampStr);

  if (command === 'all') {
    handleStatus();
  }
}

main();
export {};
