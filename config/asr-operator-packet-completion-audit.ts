import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Variables
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_TRANSCRIPTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_MODEL_DOWNLOAD = false;

// Required Whispers binaries
export const EXPECTED_MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'asr', 'whisper');
export const EXPECTED_MODELS = ['ggml-base.en.bin', 'ggml-tiny.bin'];

// Required checksum manifests
export const CHECKSUM_MANIFEST_FILES = [
  path.join(REPO_ROOT, 'asr-checksum-manifest.json'),
  path.join(REPO_ROOT, 'outputs', 'narrator', 'asr', 'asr-checksum-manifest.json')
];

// Approved audio staging folders
export const APPROVED_AUDIO_INPUT_DIRECTORIES = [
  path.join(REPO_ROOT, 'recordings'),
  path.join(REPO_ROOT, 'inputAudio'),
  path.join(REPO_ROOT, 'outputs', 'asr_inputs')
];

export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

// Output paths
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_operator_completion_audit');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
