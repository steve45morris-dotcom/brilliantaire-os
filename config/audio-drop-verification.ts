import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Constants
export const AUDIO_DROP_VERIFICATION_ONLY = true;
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_UPLOAD = false;
export const ALLOW_AUDIO_DELETION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const REQUIRE_MANUAL_AUDIO_DROP = true;
export const REQUIRE_SESSION_METADATA = true;
export const REQUIRE_QUARANTINE_FOR_UNSUPPORTED = true;

// Input Folders
export const inputFolders = {
  recordings: path.join(REPO_ROOT, 'voice_sessions', 'manual_recordings'),
  metadata: path.join(REPO_ROOT, 'voice_sessions', 'session_metadata'),
  staging: path.join(REPO_ROOT, 'voice_sessions', 'transcription_staging')
};

// Output Folders
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'audio_drop_verification'),
  reports: path.join(REPO_ROOT, 'outputs', 'audio_drop_verification', 'reports'),
  inventory: path.join(REPO_ROOT, 'outputs', 'audio_drop_verification', 'inventory'),
  quarantine: path.join(REPO_ROOT, 'outputs', 'audio_drop_verification', 'quarantine'),
  staging: path.join(REPO_ROOT, 'outputs', 'audio_drop_verification', 'staging'),
  logs: path.join(REPO_ROOT, 'outputs', 'audio_drop_verification', 'logs')
};

// Format Settings
export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
export const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const RECOMMENDED_NAMING_PATTERN = 'voice_session_<session-type>_<YYYY-MM-DD>.<ext>';
