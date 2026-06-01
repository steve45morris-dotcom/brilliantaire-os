import * as path from 'path';

const rootDir = process.cwd();

// Watched Daily Reports Directory
export const BRIEFING_DAILY_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_daily_report/reports');

// Scheduled Briefing Queue Directories
export const BRIEFING_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/queue');
export const BRIEFING_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/approved');
export const BRIEFING_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/rejected');
export const BRIEFING_TTS_REQUESTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/tts_requests');
export const BRIEFING_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/reports');
export const BRIEFING_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_scheduled_briefing/logs');

// Integrations
export const TTS_QUEUE_REQUESTS_DIR = path.join(rootDir, 'outputs/narrator/tts_queue/requests');

// Parameters
export const DEFAULT_SCHEDULE_LABEL = 'daily';
export const DEFAULT_BRIEFING_TIME = '09:00';
export const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const AUTO_RUN_SCHEDULED_JOBS = false;
export const AUTO_RENDER_TTS = false;
export const AUTO_SHARE = false;
export const MANUAL_APPROVAL_REQUIRED = true;
export const MAX_QUEUED_BRIEFINGS = 50;
export const DUPLICATE_BRIEFING_PROTECTION = true;
export const READONLY_DASHBOARD_MODE = true;
