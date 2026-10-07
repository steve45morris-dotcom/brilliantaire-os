import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_TRANSCRIPTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_MODEL_DOWNLOAD = false;

// Output Target Directories
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_readiness_join');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');

// Input Directories to Read Signals From
export const CHECKSUM_VALIDATION_MANIFEST_DIR = path.join(REPO_ROOT, 'outputs', 'asr_validation');
export const AUDIO_STAGING_MANIFEST_DIR = path.join(REPO_ROOT, 'outputs', 'asr_audio_staging');
