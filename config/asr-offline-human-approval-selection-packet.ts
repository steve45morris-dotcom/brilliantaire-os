import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const ALLOW_ASR_EXECUTION: boolean = false;
export const ALLOW_AUDIO_TRANSCRIPTION: boolean = false;
export const ALLOW_EXTERNAL_API_CALLS: boolean = false;
export const ALLOW_MODEL_DOWNLOAD: boolean = false;

// Output Target Directories
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_human_selection');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');

// Input Directories to Read Signals From
export const APPROVAL_SWITCH_MANIFEST_DIR = path.join(REPO_ROOT, 'outputs', 'asr_execution_approval');
export const AUDIO_STAGING_MANIFEST_DIR = path.join(REPO_ROOT, 'outputs', 'asr_audio_staging');
