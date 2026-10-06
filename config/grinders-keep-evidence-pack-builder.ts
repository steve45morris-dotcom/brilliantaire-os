import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Pack Builder';
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
export const AUTO_EXECUTION_ALLOWED = false;
export const EVIDENCE_CREATION_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_builder');
export const outputFolders = {
  root: OUTPUT_ROOT,
  packet: path.join(OUTPUT_ROOT, 'packet'),
  items: path.join(OUTPUT_ROOT, 'items'),
  metadataCards: path.join(OUTPUT_ROOT, 'metadata_cards'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Input Folders Setup
export const inputFolders = {
  evidenceCollection: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  loopAuditorManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_loop_closure_auditor', 'grinders_keep_evidence_loop_closure_manifest_2026-06-01.json'),
  actionBoardManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'manual_evidence_action_board', 'grinders_keep_manual_evidence_action_manifest_2026-06-01.json'),
  completionManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_completion_tracker', 'grinders_keep_evidence_completion_manifest_2026-06-01.json'),
  collectionQueueManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_queue', 'grinders_keep_evidence_collection_manifest_2026-06-01.json'),
  revalidationManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_revalidation_trigger', 'grinders_keep_revalidation_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
