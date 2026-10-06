import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Collection Session Logger';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;

// Safety overrides strictly locked to false
export const EVIDENCE_VALIDATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const COMMAND_EXECUTION_ALLOWED = false;
export const EXTERNAL_TOOL_EXECUTION_ALLOWED = false;

// Input Directories Setup
export const INPUT_ROOT = path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection_sessions');
export const inputFolders = {
  root: INPUT_ROOT,
  attemptLogs: path.join(INPUT_ROOT, 'attempt_logs'),
  completionNotes: path.join(INPUT_ROOT, 'completion_notes'),
  blockers: path.join(INPUT_ROOT, 'blockers'),
  fileReferences: path.join(INPUT_ROOT, 'file_references'),
};

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_session_logger');
export const outputFolders = {
  root: OUTPUT_ROOT,
  sessionForms: path.join(OUTPUT_ROOT, 'session_forms'),
  ledgers: path.join(OUTPUT_ROOT, 'ledgers'),
  blockers: path.join(OUTPUT_ROOT, 'blockers'),
  completionNotes: path.join(OUTPUT_ROOT, 'completion_notes'),
  fileReferences: path.join(OUTPUT_ROOT, 'file_references'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  executionGuideManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_execution_guide', 'grinders_keep_execution_guide_manifest_2026-06-01.json'),
  executionGuideReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_execution_guide', 'grinders_keep_execution_guide_report_2026-06-01.md'),
  intakeLockManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'grinders_keep_intake_lock_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
  evidenceCollectionDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};
