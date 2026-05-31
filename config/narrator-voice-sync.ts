import * as path from 'path';

const rootDir = process.cwd();

export const VOICE_SYNC_OUTPUT_DIR = path.join(rootDir, 'outputs/narrator/voice_sync');
export const VOICE_PACKET_DIR = path.join(rootDir, 'outputs/narrator/voice_sync/packets');
export const VNP_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/voice_sync/vnp_queue');
export const VOICE_SYNC_LOG_DIR = path.join(rootDir, 'outputs/narrator/voice_sync/logs');

export const LATEST_VOICE_SCRIPT_DIR = path.join(rootDir, 'outputs/narrator/voice_scripts');
export const LIVE_FEED_PATH = path.join(rootDir, 'outputs/narrator/live_feed/narrator_live_feed.json');

// Safety Gate Controls
export const ALLOW_COMMAND_EXECUTION = false;
export const ALLOW_TTS_API_CALLS = false;
export const ALLOW_BACKGROUND_AUTOMATION = false;
export const OUTPUT_ONLY_MODE = true;
export const MAX_VOICE_SCRIPT_LENGTH = 3000;
