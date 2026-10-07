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

// Input Source Manifest Locations (statically mapping 2026-06-01 or dynamically matching runtime date)
export const GATE_MANIFESTS = {
  checksum: path.join(REPO_ROOT, 'outputs', 'asr_validation', 'asr_checksum_validation_manifest_2026-06-01.json'),
  audio_staging: path.join(REPO_ROOT, 'outputs', 'asr_audio_staging', 'asr_audio_staging_manifest_2026-06-01.json'),
  readiness_join: path.join(REPO_ROOT, 'outputs', 'asr_readiness_join', 'asr_readiness_join_manifest_2026-06-01.json'),
  asset_preflight: path.join(REPO_ROOT, 'outputs', 'asr_asset_preflight', 'asr_asset_preflight_manifest_2026-06-01.json')
};

// Checksum Manifest Files to Inspect
export const CHECKSUM_MANIFEST_FILES = [
  path.join(REPO_ROOT, 'asr-checksum-manifest.json'),
  path.join(REPO_ROOT, 'outputs', 'narrator', 'asr', 'asr-checksum-manifest.json')
];

// Physical paths to inspect
export const EXPECTED_MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'asr', 'whisper');
export const EXPECTED_MODELS = ['ggml-base.en.bin', 'ggml-tiny.bin'];

export const APPROVED_AUDIO_INPUT_DIRECTORIES = [
  path.join(REPO_ROOT, 'recordings'),
  path.join(REPO_ROOT, 'inputAudio'),
  path.join(REPO_ROOT, 'outputs', 'asr_inputs')
];

export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

// Output Directories
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_revalidation');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
