import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Execution Approval Queue';
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
export const INPUT_SYNTHESIS_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis');
export const inputSynthesisFolders = {
  root: INPUT_SYNTHESIS_ROOT,
  checklists: path.join(INPUT_SYNTHESIS_ROOT, 'checklists'),
  scorecards: path.join(INPUT_SYNTHESIS_ROOT, 'scorecards'),
  telemetry: path.join(INPUT_SYNTHESIS_ROOT, 'telemetry'),
};

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'execution_approval_queue');
export const outputFolders = {
  root: OUTPUT_ROOT,
  tickets: path.join(OUTPUT_ROOT, 'tickets'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  decisionSynthesisDir: INPUT_SYNTHESIS_ROOT,
  decisionSynthesisManifest: path.join(INPUT_SYNTHESIS_ROOT, 'grinders_keep_decision_synthesis_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};

// Optional telemetry source files
export const optionalSources = {
  manualReviewIntake: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_review_intake'),
  consensusReview: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review'),
  googleUltra: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra'),
  contentLab: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab'),
  adaptiveDeepener: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener'),
  gapHunter: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter'),
  dailyBrief: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
};
