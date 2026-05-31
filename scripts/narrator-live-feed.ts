import * as fs from 'fs';
import * as path from 'path';
import {
  LIVE_FEED_OUTPUT_DIR,
  LIVE_EVENTS_DIR,
  LIVE_LOG_DIR,
  DASHBOARD_FEED_SOURCE_DIR,
  OPERATOR_BRIEFS_SOURCE_DIR,
  VOICE_SCRIPTS_SOURCE_DIR,
  SOURCE_SNAPSHOTS_SOURCE_DIR,
  NARRATOR_CARD_PATH,
  ALLOW_FRONTEND_COMMANDS,
  ALLOW_FRONTEND_WRITES,
  OUTPUT_ONLY_MODE,
  ENABLE_WEBSOCKET,
  ENABLE_EVENT_WATCHER
} from '../config/narrator-live-feed.js';

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

// ─── Command Handlers ─────────────────────────────────────────────────────────

function handleGenerate(card: any, timestampStr: string): any {
  fs.mkdirSync(LIVE_FEED_OUTPUT_DIR, { recursive: true });

  const latestDashboard = getLatestFile(DASHBOARD_FEED_SOURCE_DIR);
  const latestOperator = getLatestFile(OPERATOR_BRIEFS_SOURCE_DIR);
  const latestVoice = getLatestFile(VOICE_SCRIPTS_SOURCE_DIR);
  const latestSnapshot = getLatestFile(SOURCE_SNAPSHOTS_SOURCE_DIR);

  const compactSummary = `${card.what_we_did || ''} ${card.what_it_is || ''} ${card.whats_left || ''}`.trim();

  const liveFeedData = {
    headline: card.headline || 'System Operational Summary',
    compact_summary: compactSummary || 'No summary compiled.',
    mood: card.mood || 'nominal',
    status_color: card.status_color || 'green',
    key_metrics: card.key_metrics || {},
    sources_used: card.sources_used || [],
    generated_at: new Date().toISOString(),
    safety_mode: card.safety_mode || 'output_only',
    latest_operator_brief: latestOperator ? path.basename(latestOperator) : 'none',
    latest_dashboard_feed: latestDashboard ? path.basename(latestDashboard) : 'none',
    latest_voice_script: latestVoice ? path.basename(latestVoice) : 'none',
    latest_source_snapshot: latestSnapshot ? path.basename(latestSnapshot) : 'none',
    feed_mode: 'read_only',
    frontend_commands_allowed: ALLOW_FRONTEND_COMMANDS
  };

  const mainFeedPath = path.join(LIVE_FEED_OUTPUT_DIR, 'narrator_live_feed.json');
  const timestampedFeedPath = path.join(LIVE_FEED_OUTPUT_DIR, `narrator_live_feed_${timestampStr}.json`);

  fs.writeFileSync(mainFeedPath, JSON.stringify(liveFeedData, null, 2), 'utf-8');
  fs.writeFileSync(timestampedFeedPath, JSON.stringify(liveFeedData, null, 2), 'utf-8');

  console.log(`[OK] Live Feed compiled: ${mainFeedPath}`);
  console.log(`[OK] Backup created: ${timestampedFeedPath}`);

  return liveFeedData;
}

function handleEvent(card: any, timestampStrSeconds: string): string {
  fs.mkdirSync(LIVE_EVENTS_DIR, { recursive: true });

  const latestDashboard = getLatestFile(DASHBOARD_FEED_SOURCE_DIR);

  const eventData = {
    event_type: 'NARRATION_UPDATE',
    created_at: new Date().toISOString(),
    source_card: path.basename(NARRATOR_CARD_PATH),
    source_dashboard_feed: latestDashboard ? path.basename(latestDashboard) : 'none',
    status_color: card.status_color || 'green',
    mood: card.mood || 'nominal',
    message: `System narration updated: ${card.headline || 'Nominal execution'}`,
    safety_mode: card.safety_mode || 'output_only'
  };

  const eventPath = path.join(LIVE_EVENTS_DIR, `narrator_event_${timestampStrSeconds}.json`);
  fs.writeFileSync(eventPath, JSON.stringify(eventData, null, 2), 'utf-8');

  console.log(`[OK] Live Event logged: ${eventPath}`);
  return eventPath;
}

function handleStatus() {
  const feedExists = fs.existsSync(path.join(LIVE_FEED_OUTPUT_DIR, 'narrator_live_feed.json')) ? 'YES' : 'NO';
  const latestFeed = getLatestFile(LIVE_FEED_OUTPUT_DIR);
  const latestEvent = getLatestFile(LIVE_EVENTS_DIR);
  const latestDashboard = getLatestFile(DASHBOARD_FEED_SOURCE_DIR);

  console.log('\n=========================================');
  console.log('📡 AI Narrator Live Feed Status Report');
  console.log('=========================================');
  console.log(`Live Feed Exists       : ${feedExists}`);
  console.log(`Latest Live Feed File  : ${latestFeed ? path.basename(latestFeed) : 'none'}`);
  console.log(`Latest Event Log File  : ${latestEvent ? path.basename(latestEvent) : 'none'}`);
  console.log(`Latest Dashboard Feed  : ${latestDashboard ? path.basename(latestDashboard) : 'none'}`);
  console.log(`Latest Narrator Card   : ${fs.existsSync(NARRATOR_CARD_PATH) ? 'YES' : 'NO'}`);
  console.log('-----------------------------------------');
  console.log('🔒 Safety Configuration Controls:');
  console.log(`  - Frontend Command Invocation Allowed: ${ALLOW_FRONTEND_COMMANDS}`);
  console.log(`  - Frontend OS Write Mutation Allowed: ${ALLOW_FRONTEND_WRITES}`);
  console.log(`  - Output-Only Enforcement (Sandbox): ${OUTPUT_ONLY_MODE}`);
  console.log(`  - Event File System Watcher Enabled: ${ENABLE_EVENT_WATCHER}`);
  console.log(`  - WebSocket Communication Protocol   : ${ENABLE_WEBSOCKET ? 'ENABLED (DEPRECATED)' : 'DISABLED (BATCH-MODE ONLY)'}`);
  console.log('-----------------------------------------');
  console.log(`Next Recommended Action: ${feedExists === 'NO' ? 'Execute generate command.' : 'Check dashboard loading status.'}`);
  console.log('=========================================\n');
}

function handleWatchOnce(card: any, timestampStr: string, timestampStrSeconds: string) {
  // Find latest event file
  const latestEvent = getLatestFile(LIVE_EVENTS_DIR);
  
  let changed = false;
  let reason = '';

  if (!latestEvent) {
    changed = true;
    reason = 'No historical events detected. Generating initial live feed event.';
  } else {
    const eventStat = fs.statSync(latestEvent);
    const cardStat = fs.existsSync(NARRATOR_CARD_PATH) ? fs.statSync(NARRATOR_CARD_PATH) : null;
    const latestDashboard = getLatestFile(DASHBOARD_FEED_SOURCE_DIR);
    const dashboardStat = latestDashboard ? fs.statSync(latestDashboard) : null;

    if (cardStat && cardStat.mtimeMs > eventStat.mtimeMs) {
      changed = true;
      reason = `Narrator card file modified at ${cardStat.mtime.toISOString()} which is newer than last event.`;
    } else if (dashboardStat && dashboardStat.mtimeMs > eventStat.mtimeMs) {
      changed = true;
      reason = `Dashboard feed file modified at ${dashboardStat.mtime.toISOString()} which is newer than last event.`;
    }
  }

  fs.mkdirSync(LIVE_LOG_DIR, { recursive: true });
  const checkLogPath = path.join(LIVE_LOG_DIR, 'watch_check_log.txt');

  if (changed) {
    console.log(`[WATCH-ONCE] Changes detected: ${reason}`);
    handleGenerate(card, timestampStr);
    handleEvent(card, timestampStrSeconds);
    fs.appendFileSync(checkLogPath, `[${new Date().toISOString()}] UPDATE TRIGGERED: ${reason}\n`, 'utf-8');
  } else {
    console.log('[WATCH-ONCE] No updates needed. System telemetry is already synchronized.');
    fs.appendFileSync(checkLogPath, `[${new Date().toISOString()}] NO UPDATE NEEDED: Telemetry synchronized.\n`, 'utf-8');
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase().trim() : 'help';

  const validCommands = ['help', 'generate', 'status', 'event', 'watch-once'];

  if (!validCommands.includes(command)) {
    console.error(`[ERR] Unknown command: "${command}". Run "npm run narrator-live-feed-help" for options.`);
    process.exit(1);
  }

  if (command === 'help') {
    console.log('Run "npm run narrator-live-feed-help" to see available options.');
    return;
  }

  if (command === 'status') {
    handleStatus();
    return;
  }

  // Load narrator card input
  if (!fs.existsSync(NARRATOR_CARD_PATH)) {
    console.error(`[ERR] Required input file missing: ${NARRATOR_CARD_PATH}. Please run narrator task first.`);
    process.exit(1);
  }

  let card = {};
  try {
    card = JSON.parse(fs.readFileSync(NARRATOR_CARD_PATH, 'utf-8'));
  } catch (e) {
    console.error(`[ERR] Failed to parse narrator card JSON: ${e}`);
    process.exit(1);
  }

  const now = new Date();
  const timestampStr = getTimestampStr(now);
  const timestampStrSeconds = getTimestampStr(now, true);

  if (command === 'generate') {
    handleGenerate(card, timestampStr);
  } else if (command === 'event') {
    handleEvent(card, timestampStrSeconds);
  } else if (command === 'watch-once') {
    handleWatchOnce(card, timestampStr, timestampStrSeconds);
  }
}

main();
