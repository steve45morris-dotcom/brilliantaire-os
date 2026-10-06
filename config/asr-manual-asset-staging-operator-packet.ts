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

// Expected Whisper binaries
export const EXPECTED_MODEL_DIRECTORY = 'models/asr/whisper/';
export const EXPECTED_MODELS = ['ggml-base.en.bin', 'ggml-tiny.bin'];

// Required checksum manifest locations
export const CHECKSUM_MANIFEST_FILES = [
  'asr-checksum-manifest.json',
  'outputs/narrator/asr/asr-checksum-manifest.json'
];

// Approved audio staging folders
export const APPROVED_AUDIO_INPUT_DIRECTORIES = [
  'recordings/',
  'inputAudio/',
  'outputs/asr_inputs/'
];

export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

// Output paths
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_operator_packet');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
