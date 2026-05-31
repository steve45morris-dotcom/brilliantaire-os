import * as path from 'path';

const rootDir = process.cwd();

// Directories for Voice Session Recorder
export const REC_RECORDINGS_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/recordings');
export const REC_METADATA_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/metadata');
export const REC_ARCHIVE_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/archive');
export const REC_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/rejected');
export const REC_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_sessions/logs');

// Staging target for ASR input
export const REC_ASR_INPUT_DIR = path.join(rootDir, 'outputs/narrator/asr/input_audio');

// Audio Format Options
export const ALLOWED_AUDIO_FORMATS = ['wav', 'mp3', 'm4a'];
export const DEFAULT_RECORDING_FORMAT = 'wav';

// Limits & Safety Bounds
export const MAX_RECORDING_DURATION_SECONDS = 60; // 1 minute limit per voice session
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB maximum audio file size

// Safety Config Matrix (Strict local constraints)
export const LIVE_MIC_ENABLED = false;
export const BACKGROUND_RECORDING_ENABLED = false;
export const AUTO_TRANSCRIBE_AFTER_RECORDING = false;
export const AUTO_APPROVE_TRANSCRIPT = false;
export const AUTO_EXECUTE_COMMAND = false;
export const CONFIRMATION_REQUIRED = true;
export const OVERWRITE_RECORDINGS = false;

// Naming Pattern
export const SESSION_NAMING_PATTERN = 'voice_session_{{SESSION_NAME}}_{{TIMESTAMP}}';
