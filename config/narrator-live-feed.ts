import * as path from 'path';

const rootDir = process.cwd();

export const LIVE_FEED_OUTPUT_DIR = path.join(rootDir, 'outputs/narrator/live_feed');
export const LIVE_EVENTS_DIR = path.join(rootDir, 'outputs/narrator/live_feed/events');
export const LIVE_LOG_DIR = path.join(rootDir, 'outputs/narrator/live_feed/logs');

export const DASHBOARD_FEED_SOURCE_DIR = path.join(rootDir, 'outputs/narrator/dashboard_feed');
export const OPERATOR_BRIEFS_SOURCE_DIR = path.join(rootDir, 'outputs/narrator/operator_briefs');
export const VOICE_SCRIPTS_SOURCE_DIR = path.join(rootDir, 'outputs/narrator/voice_scripts');
export const SOURCE_SNAPSHOTS_SOURCE_DIR = path.join(rootDir, 'outputs/narrator/source_snapshots');

export const NARRATOR_CARD_PATH = path.join(rootDir, 'outputs/narrator_card.json');

// Safety Gate Controls
export const ENABLE_WEBSOCKET = false;
export const ENABLE_EVENT_WATCHER = true;
export const ALLOW_FRONTEND_COMMANDS = false;
export const ALLOW_FRONTEND_WRITES = false;
export const OUTPUT_ONLY_MODE = true;
export const WATCH_INTERVAL_MS = 8000;
