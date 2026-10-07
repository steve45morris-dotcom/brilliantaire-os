import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Final Human Launch Switch';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;

// 1. Input Directories Setup
export const INPUT_QUEUE_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'execution_approval_queue');
export const inputQueueFolders = {
  root: INPUT_QUEUE_ROOT,
  tickets: path.join(INPUT_QUEUE_ROOT, 'tickets'),
  blocked: path.join(INPUT_QUEUE_ROOT, 'blocked'),
  scorecards: path.join(INPUT_QUEUE_ROOT, 'scorecards'),
};

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'final_launch_switch');
export const outputFolders = {
  root: OUTPUT_ROOT,
  eligible: path.join(OUTPUT_ROOT, 'eligible'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  manualCommands: path.join(OUTPUT_ROOT, 'manual_commands'),
  checklists: path.join(OUTPUT_ROOT, 'checklists'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  executionQueueDir: INPUT_QUEUE_ROOT,
  executionQueueManifest: path.join(INPUT_QUEUE_ROOT, 'grinders_keep_execution_queue_manifest_2026-06-01.json'),
  decisionSynthesisDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis'),
  decisionSynthesisChecklistsDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis', 'checklists'),
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
