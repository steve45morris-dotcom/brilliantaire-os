import * as path from 'path';

const rootDir = process.cwd();

// Scheduled Briefing Queue Directories
export const BRIEFING_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/queue');
export const BRIEFING_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/approved');
export const BRIEFING_TTS_REQUEST_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/tts_requests');

// Narrator TTS Queue Directories
export const NARRATOR_TTS_PENDING_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/render_requests');
export const NARRATOR_TTS_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/approved');
export const NARRATOR_TTS_RENDERED_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');
export const NARRATOR_TTS_LOGS_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/logs');

// Briefing TTS Render Approval Flow Local Directories
export const BRIEFING_FLOW_ROOT = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval');
export const BRIEFING_FLOW_SUBMITTED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/submitted');
export const BRIEFING_FLOW_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/approved');
export const BRIEFING_FLOW_RENDERED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/rendered');
export const BRIEFING_FLOW_BLOCKED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/blocked');
export const BRIEFING_FLOW_LOGS_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/logs');
export const BRIEFING_FLOW_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/reports');

// Allowed parameters and safety gates
export const ALLOWED_BRIEFING_SOURCE_STATUS = 'approved';
export const ALLOWED_TTS_FORMATS = ['mp3', 'wav'];
export const DEFAULT_OUTPUT_FORMAT = 'mp3';
export const AUTO_APPROVE_TTS = false;
export const AUTO_RENDER_TTS = false;
export const AUTO_PLAYBACK = false;
export const CLOUD_TTS_ENABLED = false;
export const DUPLICATE_RENDER_PROTECTION = true;
export const MANUAL_CONFIRMATION_REQUIRED = true;
export const MAX_BRIEFING_TEXT_LENGTH = 3000;
