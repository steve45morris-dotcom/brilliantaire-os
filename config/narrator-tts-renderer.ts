import * as path from 'path';

const rootDir = process.cwd();

export const APPROVED_REQUEST_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/approved');
export const RENDERED_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');
export const RENDERER_LOG_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/logs');

export const DEFAULT_VOICE_PROFILE = 'oracle-neutral';
export const PREFERRED_OUTPUT_FORMAT = 'mp3'; // Default output format (mp3/wav)
export const RENDERER_BACKEND = 'piper'; // Default backend engine

// Safety constraints
export const ALLOW_EXTERNAL_TTS_API = false;
export const ALLOW_AUDIO_PLAYBACK = false;
export const ALLOW_COMMAND_EXECUTION = false; // Block subprocess commands in requests
export const DRY_RUN_MODE = false;
export const MAX_TEXT_LENGTH = 3000;
export const ALLOWED_FILE_EXTENSIONS = ['.md', '.txt'];
