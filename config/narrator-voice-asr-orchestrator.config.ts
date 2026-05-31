import * as path from 'path';

const rootDir = process.cwd();

// Staging Folders for Voice Sessions
export const ORCH_SESSIONS_RECORDINGS_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/recordings');
export const ORCH_SESSIONS_METADATA_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/metadata');

// Staging Folders for ASR Engine
export const ORCH_ASR_INPUT_DIR = path.join(rootDir, 'outputs/narrator/asr/input_audio');
export const ORCH_ASR_TRANSCRIPTS_DIR = path.join(rootDir, 'outputs/narrator/asr/transcripts');
export const ORCH_ASR_STAGED_DIR = path.join(rootDir, 'outputs/narrator/asr/staged_commands');
export const ORCH_ASR_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/asr/approved');

// Staging Folders for Voice Bridge
export const ORCH_BRIDGE_READY_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/ready');
export const ORCH_BRIDGE_EXECUTED_DIR = path.join(rootDir, 'outputs/narrator/voice_bridge/executed');

// Orchestrator Logs & Reports
export const ORCH_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_asr_orchestrator/logs');
export const ORCH_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_asr_orchestrator/reports');

// Dispatch Validation Criteria
export const ALLOWED_SESSION_STATUSES = ['stopped', 'staged_for_asr', 'transcribed', 'command_staged', 'approved', 'rejected', 'archived'];
export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];

// Safety Configuration Matrix
export const AUTO_TRANSCRIBE_AFTER_SESSION = false;
export const AUTO_STAGE_COMMAND_AFTER_TRANSCRIPT = false;
export const AUTO_APPROVE_TRANSCRIPT = false;
export const AUTO_EXECUTE_COMMAND = false;
export const CONFIRMATION_REQUIRED = true;
export const DUPLICATE_DISPATCH_PROTECTION = true;

export const MAX_BATCH_SIZE = 5;
export const DEFAULT_ORCHESTRATOR_MODE = 'manual';
