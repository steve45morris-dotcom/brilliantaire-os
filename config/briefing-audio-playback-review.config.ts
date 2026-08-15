import * as path from 'path';

const rootDir = process.cwd();

// Audio directories
export const NARRATOR_TTS_RENDERED_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');
export const BRIEFING_TTS_RENDERED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/rendered');

// Review Flow directories
export const REVIEW_FLOW_ROOT = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review');
export const REVIEW_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/queue');
export const REVIEW_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/approved');
export const REVIEW_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/rejected');
export const REVIEW_LOGS_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/logs');
export const REVIEW_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/reports');

// Allowed audio types and constraints
export const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a'];
export const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const DEFAULT_REVIEW_STATUS = 'pending_review';

// Safety Gates
export const AUTO_PLAYBACK = false;
export const AUTO_PUBLISH = false;
export const AUTO_SEND = false;
export const CLOUD_UPLOAD_ENABLED = false;
export const MANUAL_REVIEW_REQUIRED = true;
export const DUPLICATE_REVIEW_PROTECTION = true;
