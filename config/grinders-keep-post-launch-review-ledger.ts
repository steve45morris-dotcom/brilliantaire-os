import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Post-Launch Review Ledger';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;

// 1. Input Directories Setup
export const INPUT_LAUNCH_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'final_launch_switch');
export const INPUT_RECORDS_ROOT = path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'post_launch_records');

export const inputFolders = {
  root: INPUT_RECORDS_ROOT,
  manualCommands: path.join(INPUT_RECORDS_ROOT, 'manual_commands'),
  outcomes: path.join(INPUT_RECORDS_ROOT, 'outcomes'),
  screenshots: path.join(INPUT_RECORDS_ROOT, 'screenshots'),
  notes: path.join(INPUT_RECORDS_ROOT, 'notes'),
};

// 2. Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'post_launch_ledger');
export const outputFolders = {
  root: OUTPUT_ROOT,
  records: path.join(OUTPUT_ROOT, 'records'),
  verifications: path.join(OUTPUT_ROOT, 'verifications'),
  outcomes: path.join(OUTPUT_ROOT, 'outcomes'),
  telemetry: path.join(OUTPUT_ROOT, 'telemetry'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  launchSwitchDir: INPUT_LAUNCH_ROOT,
  launchSwitchManifest: path.join(INPUT_LAUNCH_ROOT, 'grinders_keep_final_launch_manifest_2026-06-01.json'),
  postLaunchRecordsDir: INPUT_RECORDS_ROOT,
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
  executionQueueDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'execution_approval_queue'),
  decisionSynthesisDir: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'decision_synthesis'),
  manualReviewIntake: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_review_intake'),
  consensusReview: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'consensus_review'),
  googleUltra: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'google_ultra'),
  contentLab: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'content_lab'),
  adaptiveDeepener: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'adaptive_deepener'),
  gapHunter: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'gap_hunter'),
  dailyBrief: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'daily_brief'),
};
