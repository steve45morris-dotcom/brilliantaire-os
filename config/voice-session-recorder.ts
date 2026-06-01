import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const RECORDER_SCAFFOLD_ONLY = true;
export const ALLOW_MICROPHONE_RECORDING = false;
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_TTS_GENERATION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_MANUAL_AUDIO_DROP = true;
export const REQUIRE_MANUAL_REVIEW = true;

// File Configuration
export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
export const MAX_AUDIO_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

// Valid Session Types
export const VALID_SESSION_TYPES = [
  'narrator briefing',
  'oracle voice note',
  'campaign command voice',
  'grounded insight read',
  'system status readout'
];

export const outputFolders = {
  root: path.join(REPO_ROOT, 'voice_sessions'),
  manualRecordings: path.join(REPO_ROOT, 'voice_sessions', 'manual_recordings'),
  sessionMetadata: path.join(REPO_ROOT, 'voice_sessions', 'session_metadata'),
  reviewReports: path.join(REPO_ROOT, 'voice_sessions', 'review_reports'),
  transcriptionStaging: path.join(REPO_ROOT, 'voice_sessions', 'transcription_staging'),
  logs: path.join(REPO_ROOT, 'voice_sessions', 'logs')
};
