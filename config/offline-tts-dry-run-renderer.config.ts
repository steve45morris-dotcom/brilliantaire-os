import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Sandbox Controls
export const ALLOW_TTS_AUDIO = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const FAIL_CLOSED_ON_ERROR = true;

// Speech timing & Chunking settings
export const DEFAULT_SPEECH_WPM = 140;
export const DEFAULT_MAX_CHUNK_WORDS = 100; // range of 80 to 120 words

// Mock voice profile routes mapping suggested voice tones
export const voiceProfileRoutes: Record<string, string> = {
  'authoritative / grounded': 'voice_profile_sovereign_en_v1',
  'authoritative': 'voice_profile_sovereign_en_v1',
  'warning / cautionary': 'voice_profile_caution_en_v2',
  'cautionary': 'voice_profile_caution_en_v2',
  'muted / tactical': 'voice_profile_tactical_en_v1',
  'tactical': 'voice_profile_tactical_en_v1',
  'default': 'voice_profile_sovereign_en_v1'
};

// Input folder mapping (pointing to Phase 11R TTS Export output folder)
export const inputFolders = {
  ttsExport: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_export')
};

// Output folder mapping for Dry Run Renderer
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_dry_run'),
  markdown: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_dry_run', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_dry_run', 'reports'),
  json: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_dry_run', 'json'),
  logs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_dry_run', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'tts_dry_run_renderer')
};
