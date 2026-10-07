import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety Locks (ASR, transcription, downloading, and external API requests must remain disabled)
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_TRANSCRIPTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_MODEL_DOWNLOAD = false;

// Whisper Binary Models Expected
export const EXPECTED_MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'asr', 'whisper');
export const EXPECTED_MODELS = [
  {
    model_id: 'ggml-base.en.bin',
    model_filename: 'ggml-base.en.bin',
    expected_path: 'models/asr/whisper/ggml-base.en.bin',
    expected_sha256: 'a03779c86df3323075f5e796cb2ce5029f00ec8869eee3fdfb897afe36c6d002'
  },
  {
    model_id: 'ggml-tiny.bin',
    model_filename: 'ggml-tiny.bin',
    expected_path: 'models/asr/whisper/ggml-tiny.bin',
    expected_sha256: 'be07c6665cceabac4e9a7e67f0d0678d9b23b3780517faec6fa88f8d9b54c86b'
  }
];

// Manifest files to compare and check
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

// Output target locations
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_human_staged_verification');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
