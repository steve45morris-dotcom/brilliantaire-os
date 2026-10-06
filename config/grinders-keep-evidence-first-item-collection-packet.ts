import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence First-Item Collection Packet';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;

// Safety overrides strictly locked to false
export const EVIDENCE_CREATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const COMMAND_EXECUTION_ALLOWED = false;
export const EXTERNAL_TOOL_EXECUTION_ALLOWED = false;
export const EVIDENCE_VALIDATION_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet');
export const outputFolders = {
  root: OUTPUT_ROOT,
  selectedTask: path.join(OUTPUT_ROOT, 'selected_task'),
  manualPrompt: path.join(OUTPUT_ROOT, 'manual_prompt'),
  savePath: path.join(OUTPUT_ROOT, 'save_path'),
  privacy: path.join(OUTPUT_ROOT, 'privacy'),
  sessionLog: path.join(OUTPUT_ROOT, 'session_log'),
  rerun: path.join(OUTPUT_ROOT, 'rerun'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  proofReviewBoardManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_proof_review_board', 'grinders_keep_proof_review_board_manifest_2026-06-01.json'),
  executionGuideManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_execution_guide', 'grinders_keep_execution_guide_manifest_2026-06-01.json'),
  intakeLockManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'grinders_keep_intake_lock_manifest_2026-06-01.json'),
  evidenceWorkbenchManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_workbench', 'grinders_keep_evidence_workbench_manifest_2026-06-01.json'),
  
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
  evidenceCollectionDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};
