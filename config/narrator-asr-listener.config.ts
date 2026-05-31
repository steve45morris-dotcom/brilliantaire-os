import * as path from 'path';

const rootDir = process.cwd();

// Directories for controlled ASR assets
export const ASR_INPUT_AUDIO_DIR = path.join(rootDir, 'outputs/narrator/asr/input_audio');
export const ASR_TRANSCRIPTS_DIR = path.join(rootDir, 'outputs/narrator/asr/transcripts');
export const ASR_STAGED_DIR = path.join(rootDir, 'outputs/narrator/asr/staged_commands');
export const ASR_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/asr/approved');
export const ASR_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/asr/rejected');
export const ASR_LOG_DIR = path.join(rootDir, 'outputs/narrator/asr/logs');

// ASR Preferences and Configuration
export const ASR_BACKEND_PREFERENCE = 'whisper'; // Prefer local 'whisper' (whisper / whisper-cpp / faster-whisper)
export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
export const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size
export const MAX_TRANSCRIPTION_LENGTH = 2000;       // Max 2000 characters transcribed per audio clip
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;

// Critical Safety & Security Controls
export const LIVE_MICROPHONE_ENABLED = false;      // No live recording by default
export const CLOUD_ASR_ENABLED = false;            // Force local offline transcription only
export const AUTO_EXECUTE_COMMANDS = false;        // Never auto-run transcribed commands
export const MANUAL_APPROVAL_REQUIRED = true;      // Require manual approval gate
