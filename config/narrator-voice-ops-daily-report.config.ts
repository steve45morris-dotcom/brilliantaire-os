import * as path from 'path';

const rootDir = process.cwd();

// Voice Session Registries
export const REPORT_SESSIONS_RECORDINGS_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/recordings');
export const REPORT_SESSIONS_METADATA_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/metadata');

// ASR Engine Queues
export const REPORT_ASR_INPUT_DIR = path.join(rootDir, 'outputs/narrator/asr/input_audio');
export const REPORT_ASR_TRANSCRIPTS_DIR = path.join(rootDir, 'outputs/narrator/asr/transcripts');
export const REPORT_ASR_STAGED_DIR = path.join(rootDir, 'outputs/narrator/asr/staged_commands');
export const REPORT_ASR_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/asr/approved');
export const REPORT_ASR_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/asr/rejected');

// Voice Bridge Registries
export const REPORT_BRIDGE_READY_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/ready');
export const REPORT_BRIDGE_EXECUTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/executed');
export const REPORT_BRIDGE_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/rejected');
export const REPORT_BRIDGE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/logs');

// Auditor Logs & Reports
export const REPORT_AUDIT_TIMELINES_DIR = path.join(rootDir, 'outputs/narrator/voice_lifecycle_audit/reports');
export const REPORT_AUDIT_INDEX_DIR = path.join(rootDir, 'outputs/narrator/voice_lifecycle_audit/index');

// Telemetry snapshots
export const REPORT_DASHBOARD_TELEMETRY_DIR = path.join(rootDir, 'outputs/mesh_telemetry');

// Daily Report Outputs
export const REPORT_OUTPUT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_daily_report/reports');
export const REPORT_SNAPSHOT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_daily_report/snapshots');
export const REPORT_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_daily_report/logs');

// Configuration Parameters
export const DEFAULT_REPORT_PERIOD = 'today';
export const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export const INCLUDE_RAW_TRANSCRIPT_PREVIEWS = true;
export const INCLUDE_COMMAND_PREVIEWS = true;
export const INCLUDE_SAFETY_EVENTS = true;
export const INCLUDE_BLOCKED_EVENTS = true;
export const INCLUDE_RECOMMENDATIONS = true;
export const READONLY_MODE = true;
export const AUTO_EXECUTE = false;
