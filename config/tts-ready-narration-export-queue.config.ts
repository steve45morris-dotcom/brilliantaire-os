import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const ALLOW_TTS_AUDIO = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const FAIL_CLOSED_ON_ERROR = true;

// Risk Safety Threshold (only 'Low' and 'Medium' are allowed by default; 'High' is blocked)
export const MAX_SAFE_RISK_LEVEL = 'Medium'; 

// Input folder mapping (pointing to Phase 11Q voice approval output folder)
export const inputFolders = {
  approvalGate: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'voice_approval')
};

// Output folder mapping for TTS Export Queue
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_export'),
  markdown: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_export', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_export', 'reports'),
  json: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_export', 'json'),
  logs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'tts_export', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'tts_export_queue')
};
