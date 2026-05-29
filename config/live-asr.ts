import path from 'path';
import { REPO_ROOT } from './paths.js';

export const LIVE_INPUT_ROOT = path.join(REPO_ROOT, 'voice_input');
export const LIVE_AUDIO_DIR = path.join(LIVE_INPUT_ROOT, 'live');
export const LIVE_SESSIONS_DIR = path.join(LIVE_INPUT_ROOT, 'live_sessions');
export const LIVE_LOG_DIR = path.join(LIVE_INPUT_ROOT, 'live_logs');
export const MANUAL_TRANSCRIPT_DIR = path.join(LIVE_INPUT_ROOT, 'manual');

export const ACCEPTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
export const ACCEPTED_TRANSCRIPT_EXTENSIONS = ['.txt'];
export const MAX_AUDIO_FILE_MB = 25;
export const MAX_TRANSCRIPT_LENGTH = 500;
export const ENABLE_DIRECT_COMMAND_EXECUTION = false;
export const REQUIRE_VIBEVOICE_TRANSCRIPT_STEP = true;
export const REQUIRE_QUEUE_PROCESSING = true;
