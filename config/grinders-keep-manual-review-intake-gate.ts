import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Manual Review Intake Gate';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_SOCIAL_POSTS = false;
export const ALLOW_DELETION = false;
export const ALLOW_FILE_MOVES = false;
export const ALLOW_AUTO_CLEANUP = false;

// 1. Input Directories Setup
export const INPUT_ROOT = path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'manual_reviews');
export const inputFolders = {
  chatgpt: path.join(INPUT_ROOT, 'chatgpt'),
  gemini: path.join(INPUT_ROOT, 'gemini'),
  claude: path.join(INPUT_ROOT, 'claude'),
  notebooklm: path.join(INPUT_ROOT, 'notebooklm'),
  google_ultra: path.join(INPUT_ROOT, 'google_ultra'),
  google_ultra_gemini: path.join(INPUT_ROOT, 'google_ultra', 'gemini'),
  google_ultra_notebooklm: path.join(INPUT_ROOT, 'google_ultra', 'notebooklm'),
  google_ultra_flow: path.join(INPUT_ROOT, 'google_ultra', 'flow'),
  google_ultra_whisk: path.join(INPUT_ROOT, 'google_ultra', 'whisk'),
  google_ultra_veo: path.join(INPUT_ROOT, 'google_ultra', 'veo'),
  google_ultra_antigravity: path.join(INPUT_ROOT, 'google_ultra', 'antigravity'),
  google_ultra_drive_docs_sheets: path.join(INPUT_ROOT, 'google_ultra', 'drive_docs_sheets'),
  google_ultra_youtube_vids: path.join(INPUT_ROOT, 'google_ultra', 'youtube_vids'),
};

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_review_intake');
export const outputFolders = {
  root: OUTPUT_ROOT,
  validated: path.join(OUTPUT_ROOT, 'validated'),
  rejected: path.join(OUTPUT_ROOT, 'rejected'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  telemetry: path.join(OUTPUT_ROOT, 'telemetry'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary reference source files for auditing
export const referenceSources = {
  consensusReviewDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review'),
  consensusPacketsDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review', 'packets'),
  consensusScorecardsDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review', 'scorecards'),
  googleUltraDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra'),
  googleUltraWorkflowsDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra', 'workflows'),
  googleUltraScorecardsDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra', 'scorecards'),
  contentLabDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab'),
  adaptiveDeepenerDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener'),
  gapHunterDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter'),
  dailyBriefDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
