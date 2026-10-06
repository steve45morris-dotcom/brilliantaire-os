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

// Directory Mappings
export const MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'asr', 'whisper');

export const APPROVED_AUDIO_INPUT_DIRECTORIES = [
  path.join(REPO_ROOT, 'recordings'),
  path.join(REPO_ROOT, 'inputAudio'),
  path.join(REPO_ROOT, 'outputs', 'asr_inputs')
];

export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

// Output Target Directories
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_preparation');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');

// Manifest filenames
export const MANIFEST_FILENAME = 'asr-checksum-manifest.json';
export const ROOT_MANIFEST_PATH = path.join(REPO_ROOT, MANIFEST_FILENAME);
export const OFFICIAL_MANIFEST_PATH = path.join(REPO_ROOT, 'outputs', 'narrator', 'asr', MANIFEST_FILENAME);
