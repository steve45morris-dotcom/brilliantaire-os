import path from 'path';
import { REPO_ROOT, MODEL_DIRECTORY, inputFolders } from './asr-model-gate.js';

// Safety Constraints
export const ALLOW_ASR_EXECUTION = false;
export const ALLOW_AUDIO_TRANSCRIPTION = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_MODEL_DOWNLOAD = false;

// Audio Inputs Settings
export const APPROVED_AUDIO_INPUT_DIRECTORIES = [
  inputFolders.recordings, // outputs/narrator/voice_sessions/recordings
  inputFolders.inputAudio   // outputs/narrator/asr/input_audio
];

export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

// Output Target Directories
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_dry_run');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
