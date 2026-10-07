import * as path from 'path';

const rootDir = process.cwd();

// Approved and Source Directories
export const BRIEFING_AUDIO_REVIEW_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/approved');
export const BRIEFING_FLOW_RENDERED_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/rendered');
export const NARRATOR_TTS_RENDERED_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/rendered_audio');

export const BRIEFING_DAILY_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_daily_report/reports');
export const BRIEFING_SCHEDULED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing');
export const BRIEFING_TTS_REQUESTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/tts_requests');
export const BRIEFING_TTS_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_tts_render_approval/reports');
export const BRIEFING_AUDIO_REVIEW_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_audio_playback_review/reports');

// Delivery Package Directories
export const DELIVERY_PACKAGE_ROOT = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages');
export const DELIVERY_PACKAGE_OUTPUT_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/packages');
export const DELIVERY_PACKAGE_MANIFESTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/manifests');
export const DELIVERY_PACKAGE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/logs');
export const DELIVERY_PACKAGE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/reports');
export const DELIVERY_PACKAGE_BLOCKED_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/blocked');

// Formats
export const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a'];
export const ALLOWED_METADATA_FORMATS = ['md', 'json', 'txt'];

// Safety Gates
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_EMAIL = false;
export const AUTO_PLAYBACK = false;
export const MANUAL_DELIVERY_REQUIRED = true;
export const DUPLICATE_PACKAGE_PROTECTION = true;

// Package Options
export const PACKAGE_NAMING_PATTERN = 'delivery_package_{{AUDIO_ID}}';
export const INCLUDE_MANIFEST = true;
export const INCLUDE_CHECKSUM = true;
