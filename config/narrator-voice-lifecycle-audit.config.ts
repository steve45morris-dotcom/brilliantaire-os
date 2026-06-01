import * as path from 'path';

const rootDir = process.cwd();

// Voice Sessions Directories
export const AUDIT_SESSIONS_METADATA_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/metadata');
export const AUDIT_SESSIONS_RECORDINGS_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/recordings');

// ASR Intake & Target Directories
export const AUDIT_ASR_INPUT_DIR = path.join(rootDir, 'outputs/narrator/asr/input_audio');
export const AUDIT_ASR_TRANSCRIPTS_DIR = path.join(rootDir, 'outputs/narrator/asr/transcripts');
export const AUDIT_ASR_STAGED_DIR = path.join(rootDir, 'outputs/narrator/asr/staged_commands');
export const AUDIT_ASR_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/asr/approved');
export const AUDIT_ASR_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/asr/rejected');

// Voice Bridge State Directories
export const AUDIT_BRIDGE_READY_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/ready');
export const AUDIT_BRIDGE_EXECUTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/executed');
export const AUDIT_BRIDGE_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/rejected');

// Log Directories
export const AUDIT_BRIDGE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/logs');
export const AUDIT_ORCH_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_asr_orchestrator/logs');
export const AUDIT_DASHBOARD_LOGS_DIR = path.join(rootDir, 'outputs/narrator/dashboard/logs');

// Lifecycle Audit Outputs
export const AUDIT_OUTPUT_INDEX_DIR = path.join(rootDir, 'outputs/narrator/voice_lifecycle_audit/index');
export const AUDIT_REPORT_DIR = path.join(rootDir, 'outputs/narrator/voice_lifecycle_audit/reports');
export const AUDIT_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_lifecycle_audit/logs');

// Configuration Matrix Parameters
export const MAX_EVENTS_PER_REPORT = 100;
export const INCLUDE_RAW_TRANSCRIPT_PREVIEW = true;
export const REDACT_SENSITIVE_PATHS = false;
export const AUTO_EXECUTE = false;
export const READONLY_MODE_DEFAULT = true;
