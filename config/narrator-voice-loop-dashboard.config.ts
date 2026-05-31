import * as path from 'path';

const rootDir = process.cwd();

// Directories for Voice Loop components
export const DB_ASR_TRANSCRIPTS_DIR = path.join(rootDir, 'outputs/narrator/asr/transcripts');
export const DB_ASR_STAGED_DIR = path.join(rootDir, 'outputs/narrator/asr/staged_commands');
export const DB_ASR_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/asr/approved');
export const DB_ASR_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/asr/rejected');

export const DB_BRIDGE_READY_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/ready');
export const DB_BRIDGE_EXECUTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/executed');
export const DB_BRIDGE_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/rejected');
export const DB_BRIDGE_LOG_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/logs');

export const DB_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_loop_dashboard/reports');
export const DB_LOG_DIR = path.join(rootDir, 'outputs/narrator/voice_loop_dashboard/logs');

// Dashboard Behavior Configuration
export const DASHBOARD_REFRESH_MODE = 'manual';
export const AUTO_EXECUTE = false;
export const LIVE_MIC_ENABLED = false;
export const CONFIRMATION_REQUIRED = true;
export const MAX_DISPLAYED_PACKETS = 10;
export const READONLY_MODE_DEFAULT = true;

// Safe routing action registry
export const ALLOWED_DASHBOARD_ACTIONS = [
  'status',
  'overview',
  'packets',
  'packet-detail',
  'pending-confirmations',
  'safety-status',
  'latest-audit',
  'export-summary',
  'confirm-prepare',
  'confirm-execute',
  'reject-packet'
];

export const DANGER_ACTION_LIST = [
  'confirm-execute',
  'reject-packet'
];
