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

// Gate sequence targets
export const GATE_SEQUENCE_TARGETS = [
  'asr-manual-asset-presence-preflight',
  'asr-checksum-manifest-validation-gate',
  'asr-audio-input-staging-validation-gate',
  'asr-readiness-join-gate',
  'asr-manual-asset-revalidation-pass'
];

// Manifest file references for re-verification (static 2026-06-01 match)
export const MANIFEST_PATHS = {
  human_staged_verification: path.join(REPO_ROOT, 'outputs', 'asr_human_staged_verification', 'asr_human_staged_verification_manifest_2026-06-01.json'),
  preflight: path.join(REPO_ROOT, 'outputs', 'asr_asset_preflight', 'asr_asset_preflight_manifest_2026-06-01.json'),
  checksum_validation: path.join(REPO_ROOT, 'outputs', 'asr_validation', 'asr_checksum_validation_manifest_2026-06-01.json'),
  audio_staging: path.join(REPO_ROOT, 'outputs', 'asr_audio_staging', 'asr_audio_staging_manifest_2026-06-01.json'),
  readiness_join: path.join(REPO_ROOT, 'outputs', 'asr_readiness_join', 'asr_readiness_join_manifest_2026-06-01.json'),
  revalidation: path.join(REPO_ROOT, 'outputs', 'asr_revalidation', 'asr_revalidation_manifest_2026-06-01.json')
};

// Output Targets
export const OUTPUT_DIRECTORY = path.join(REPO_ROOT, 'outputs', 'asr_gate_rerun');
export const TEMPLATE_DIRECTORY = path.join(REPO_ROOT, 'templates');
