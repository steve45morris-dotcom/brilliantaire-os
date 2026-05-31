import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const SYNTHESIZER_SCAFFOLD_ONLY = true;
export const ALLOW_AUDIO_GENERATION = false;
export const ALLOW_MODEL_DOWNLOAD = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_SHELL_EXECUTION = false;
export const REQUIRE_VALIDATED_TTS_QUEUE = true;
export const REQUIRE_MANUAL_ENABLE = true;
export const REQUIRE_LOCAL_MODEL_FILE = true;

// Engine Settings
export const engineConfig = {
  engineName: 'Piper',
  engineMode: 'offline-local',
  modelDirectory: path.join(REPO_ROOT, 'models', 'tts', 'piper'),
  outputDirectory: path.join(REPO_ROOT, 'outputs', 'tts_audio', 'audio_outputs'),
  allowedAudioExtensions: ['.wav'],
  maxScriptCharacters: 6000
};

// Voice Profiles List
export const voiceProfiles = [
  'calm analyst',
  'strategic narrator',
  'energetic briefing',
  'oracle voice',
  'campaign command voice'
];

// Input and Output Directory Mappings
export const inputFolders = {
  validationReports: path.join(REPO_ROOT, 'outputs', 'tts_validation', 'reports'),
  queuePackets: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'queue_packets'),
  voiceDirections: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'voice_directions'),
  scripts: path.join(REPO_ROOT, 'outputs', 'tts_briefs', 'scripts')
};

export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'tts_audio'),
  dryRuns: path.join(REPO_ROOT, 'outputs', 'tts_audio', 'dry_runs'),
  configReports: path.join(REPO_ROOT, 'outputs', 'tts_audio', 'config_reports'),
  audioOutputs: path.join(REPO_ROOT, 'outputs', 'tts_audio', 'audio_outputs'),
  logs: path.join(REPO_ROOT, 'outputs', 'tts_audio', 'logs')
};
