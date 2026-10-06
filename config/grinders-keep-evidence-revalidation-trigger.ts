import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Revalidation Trigger';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;
export const ALLOW_COMMAND_EXECUTION = false;
export const ALLOW_FILE_MOVING = false;
export const ALLOW_FILE_COPYING = false;
export const REVALIDATION_ALLOWED = false;
export const COMMAND_EXECUTION_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_revalidation_trigger');
export const outputFolders = {
  root: OUTPUT_ROOT,
  targets: path.join(OUTPUT_ROOT, 'targets'),
  plans: path.join(OUTPUT_ROOT, 'plans'),
  manualCommands: path.join(OUTPUT_ROOT, 'manual_commands'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Input Folders Setup
export const inputFolders = {
  evidenceCollection: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files for auditing
export const referenceSources = {
  completionManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_completion_tracker', 'grinders_keep_evidence_completion_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
