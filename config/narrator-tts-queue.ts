import * as path from 'path';

const rootDir = process.cwd();

export const TTS_QUEUE_ROOT = path.join(rootDir, 'outputs/narrator/tts_queue');
export const RENDER_REQUEST_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/render_requests');
export const APPROVED_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/approved');
export const REJECTED_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rejected');
export const RENDERED_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');
export const LOG_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/logs');

export const LATEST_VOICE_PACKET_DIR = path.join(rootDir, 'outputs/narrator/voice_sync/packets');
export const LATEST_VNP_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/voice_sync/vnp_queue');

// Safety Gate Controls
export const ALLOW_EXTERNAL_TTS_API = false;
export const ALLOW_AUDIO_PLAYBACK = false;
export const ALLOW_COMMAND_EXECUTION = false;
export const OUTPUT_ONLY_MODE = true;
export const MAX_TTS_TEXT_LENGTH = 3000;
export const DEFAULT_VOICE_PROFILE = 'oracle-neutral';
export const DEFAULT_RENDER_FORMAT = 'mp3';
