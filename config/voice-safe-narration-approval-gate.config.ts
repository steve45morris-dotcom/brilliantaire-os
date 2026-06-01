import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & System Constraints
export const ALLOW_TTS_AUDIO = false;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const FAIL_CLOSED_ON_ERROR = true;

// Input folder mapping (pointing to Phase 11P narrator review queue output folder)
export const inputFolders = {
  reviewQueue: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'review_queue')
};

// Output folder mapping for Approval Gate Manifests
export const outputFolders = {
  root: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'voice_approval'),
  markdown: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'voice_approval', 'markdown'),
  reports: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'voice_approval', 'reports'),
  json: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'voice_approval', 'json'),
  logs: path.join(REPO_ROOT, 'outputs', 'grounded_narrator', 'voice_approval', 'logs'),
  templates: path.join(REPO_ROOT, 'templates', 'notebooklm_bridge', 'voice_approval_gate')
};
