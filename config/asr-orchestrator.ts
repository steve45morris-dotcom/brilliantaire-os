import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const ASR_ORCHESTRATION_ONLY = true;
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_AUDIO_UPLOAD = false;
export const ALLOW_SHELL_EXECUTION = false;
export const REQUIRE_MANUAL_ENABLE = true;
export const REQUIRE_STAGED_AUDIO = true;
export const REQUIRE_LOCAL_ASR_MODEL = true;

// ASR Engine Configuration
export const engineName = 'Whisper';
export const engineMode = 'offline-local';
export const modelDirectory = 'models/asr/whisper/';
export const stagedAudioDirectory = 'voice_sessions/manual_recordings/';
export const transcriptionStagingDirectory = 'outputs/asr_orchestrator/transcript_staging/';

// File Configuration
export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a'];
export const MAX_AUDIO_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
export const EXPECTED_MANUAL_ENABLE_VAR = 'ASR_EXECUTION_ENABLED';

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator'),
  jobPackets: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator', 'job_packets'),
  readinessReports: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator', 'readiness_reports'),
  dryRuns: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator', 'dry_runs'),
  transcriptStaging: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator', 'transcript_staging'),
  logs: path.join(REPO_ROOT, 'outputs', 'asr_orchestrator', 'logs'),
  models: path.join(REPO_ROOT, 'models', 'asr', 'whisper')
};
