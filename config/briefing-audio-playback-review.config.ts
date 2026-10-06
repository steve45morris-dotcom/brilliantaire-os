import * as path from 'path';

const rootDir = process.cwd();

// Rendered Briefing Source Directories
export const NARRATOR_TTS_RENDERED_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');
export const BRIEFING_FLOW_RENDERED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/rendered');

// Briefing Audio Playback Review Local Directories
export const BRIEFING_AUDIO_REVIEW_ROOT = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review');
export const BRIEFING_AUDIO_REVIEW_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/queue');
export const BRIEFING_AUDIO_REVIEW_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/approved');
export const BRIEFING_AUDIO_REVIEW_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/rejected');
export const BRIEFING_AUDIO_REVIEW_LOGS_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/logs');
export const BRIEFING_AUDIO_REVIEW_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/reports');

// Allowed parameters and safety gates
export const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a'];
export const AUTO_PLAYBACK = false;
export const AUTO_PUBLISH = false;
export const AUTO_SEND = false;
export const CLOUD_UPLOAD_ENABLED = false;
export const MANUAL_REVIEW_REQUIRED = true;
export const DUPLICATE_REVIEW_PROTECTION = true;
export const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
export const DEFAULT_REVIEW_STATUS = 'pending_review';
