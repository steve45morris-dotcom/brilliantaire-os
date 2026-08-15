import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const DRY_RUN_ONLY = true;
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_MODEL_DOWNLOAD = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_SHELL_EXECUTION = false;
export const ALLOW_AUDIO_MUTATION = false;
export const ALLOW_MODEL_MUTATION = false;

// Path Configurations
export const MODEL_DIRECTORY = path.join(REPO_ROOT, 'models', 'asr', 'whisper');
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_dry_run');

export const APPROVED_AUDIO_INPUT_DIRECTORIES = [
  path.join(REPO_ROOT, 'outputs', 'narrator', 'voice_sessions', 'recordings'),
  path.join(REPO_ROOT, 'outputs', 'narrator', 'asr', 'input_audio'),
  path.join(REPO_ROOT, 'voice_input')
];

// File Eligibility Constraints
export const APPROVED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];
export const ALLOWED_MODEL_EXTENSIONS = ['.bin', '.pt', '.onnx', '.ggml', '.tflite'];

// Hash & Manifest Mapping
export const PRIMARY_CHECKSUM_MANIFEST = '/Users/alexanderanthony/outputs/narrator/asr/asr-checksum-manifest.json';
export const LOCAL_CHECKSUM_MANIFEST = path.join(REPO_ROOT, 'outputs', 'narrator', 'asr', 'asr-checksum-manifest.json');

// Fallback hashes for standard GGML Whisper models to permit mock verification testing
export const FALLBACK_MODEL_CHECKSUMS: Record<string, string> = {
  'ggml-tiny.bin': 'be0768222a03cf6cc00d61f1e312ccb08ad4f9f40be3198fcf6fd9b506f2e960',
  'ggml-tiny.en.bin': '2dbfb69b03949ca020ad83d9737976e5d2b1f8f7422f254e432c70a8d7950c40',
  'ggml-base.bin': '465707469a49fe52c79f972b25841074e50882e38202476595e8654a99dc07b8',
  'ggml-base.en.bin': '137c40403dc806556e297858c42621453ab44621f83c072c44243a758783457a',
  'ggml-small.bin': '0a4ca099e2ef4f141adce56a599692482312674251df31d1edecf79b69109033',
  'ggml-medium.bin': '7d3a017d23d8c1c4e789455325c3453a99dc5d9e564d262d08a50684f886f4a8'
};
