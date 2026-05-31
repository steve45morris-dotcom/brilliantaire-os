import * as fs from 'fs';
import * as path from 'path';
import {
  LIVE_LOG_DIR,
  WATCH_INTERVAL_MS,
  NARRATOR_CARD_PATH,
  DASHBOARD_FEED_SOURCE_DIR
} from '../config/narrator-live-feed.js';

// Setup log file
fs.mkdirSync(LIVE_LOG_DIR, { recursive: true });
const watchLogPath = path.join(LIVE_LOG_DIR, 'watcher_run_log.txt');

function logActivity(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(watchLogPath, line, 'utf-8');
}

// Track file states
let lastCardTime = 0;
let lastDashboardTime = 0;

function checkFiles() {
  logActivity('Polling whitelisted narrator directories...');
  
  let cardMtime = 0;
  if (fs.existsSync(NARRATOR_CARD_PATH)) {
    cardMtime = fs.statSync(NARRATOR_CARD_PATH).mtimeMs;
  }

  let dashboardMtime = 0;
  if (fs.existsSync(DASHBOARD_FEED_SOURCE_DIR)) {
    const files = fs.readdirSync(DASHBOARD_FEED_SOURCE_DIR);
    for (const file of files) {
      if (file.startsWith('.')) continue;
      const fullPath = path.join(DASHBOARD_FEED_SOURCE_DIR, file);
      const mtime = fs.statSync(fullPath).mtimeMs;
      if (mtime > dashboardMtime) {
        dashboardMtime = mtime;
      }
    }
  }

  if (lastCardTime === 0 && lastDashboardTime === 0) {
    // Initial loop execution
    lastCardTime = cardMtime;
    lastDashboardTime = dashboardMtime;
    logActivity('Watcher initialized with baseline timestamps.');
    return;
  }

  if (cardMtime > lastCardTime) {
    logActivity(`[ALERT] Narrator Card changed. New mtime: ${new Date(cardMtime).toISOString()}`);
    lastCardTime = cardMtime;
  }
  if (dashboardMtime > lastDashboardTime) {
    logActivity(`[ALERT] Dashboard feed sources updated. New mtime: ${new Date(dashboardMtime).toISOString()}`);
    lastDashboardTime = dashboardMtime;
  }
}

function startWatcher() {
  console.log('\n===================================================');
  console.log('📡 AI Narrator Local Watcher Active');
  console.log('===================================================');
  console.log('Status: Running in local read-only observation mode.');
  console.log(`Polling interval: ${WATCH_INTERVAL_MS} ms`);
  console.log(`Log File: ${watchLogPath}`);
  console.log('Press Ctrl+C to terminate the loop.');
  console.log('===================================================\n');

  logActivity('Watcher daemon process started.');

  // Run immediately
  checkFiles();

  // Set interval loop
  const timer = setInterval(() => {
    try {
      checkFiles();
    } catch (e) {
      logActivity(`[ERR] Polling error encountered: ${e}`);
    }
  }, WATCH_INTERVAL_MS);

  // Terminate cleanly on Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(timer);
    logActivity('Watcher daemon received SIGINT. Shutting down cleanly.');
    process.exit(0);
  });
}

// Start watch daemon
startWatcher();
