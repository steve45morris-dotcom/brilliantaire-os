import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep Evidence Session Import Bridge';
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
export const AUTO_IMPORT_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_session_import_bridge');
export const outputFolders = {
  root: OUTPUT_ROOT,
  maps: path.join(OUTPUT_ROOT, 'maps'),
  importerSources: path.join(OUTPUT_ROOT, 'importer_sources'),
  blocked: path.join(OUTPUT_ROOT, 'blocked'),
  pathChecks: path.join(OUTPUT_ROOT, 'path_checks'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  sessionLoggerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_session_logger', 'grinders_keep_session_logger_manifest_2026-06-01.json'),
  sessionLoggerReport: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_session_logger', 'grinders_keep_session_logger_report_2026-06-01.md'),
  evidencePackImportManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer', 'grinders_keep_evidence_pack_import_manifest_2026-06-01.json'),
  intakeLockManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_intake_lock', 'grinders_keep_intake_lock_manifest_2026-06-01.json'),
  executionGuideManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_execution_guide', 'grinders_keep_execution_guide_manifest_2026-06-01.json'),
  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'COMMANDS.md'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
  evidenceCollectionDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection'),
};
