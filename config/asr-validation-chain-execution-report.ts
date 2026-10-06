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
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_validation_chain');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');

// Input Directories to read manifests from
export const RERUN_TRIGGER_DIR = path.join(REPO_ROOT, 'outputs', 'asr_rerun_trigger');
export const HUMAN_STAGED_VERIFICATION_DIR = path.join(REPO_ROOT, 'outputs', 'asr_human_staged_verification');
export const ASSET_PREFLIGHT_DIR = path.join(REPO_ROOT, 'outputs', 'asr_asset_preflight');
export const CHECKSUM_VALIDATION_DIR = path.join(REPO_ROOT, 'outputs', 'asr_validation');
export const AUDIO_STAGING_DIR = path.join(REPO_ROOT, 'outputs', 'asr_audio_staging');
export const READINESS_JOIN_DIR = path.join(REPO_ROOT, 'outputs', 'asr_readiness_join');
export const REVALIDATION_DIR = path.join(REPO_ROOT, 'outputs', 'asr_revalidation');
export const GATE_RERUN_DIR = path.join(REPO_ROOT, 'outputs', 'asr_gate_rerun');
