import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Locks
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_TRANSCRIPTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_MODEL_DOWNLOAD = false;

// Input Paths
export const OPERATOR_AUDIT_MANIFEST_DIR = path.join(REPO_ROOT, 'outputs', 'asr_operator_completion_audit');

// Output paths
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_rerun_trigger');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
