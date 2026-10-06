import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep First Evidence Importer Gate';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;

// Safety overrides strictly locked to false
export const CONTENT_VALIDATION_PERFORMED = false;
export const EVIDENCE_VALIDATION_ALLOWED = false;
export const EVIDENCE_CREATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const COMMAND_EXECUTION_ALLOWED = false;
export const EXTERNAL_TOOL_EXECUTION_ALLOWED = false;
export const IMPORTER_HANDOFF_ALLOWED = false;
export const AUTO_IMPORT_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_importer_gate');
export const outputFolders = {
  root: OUTPUT_ROOT,
  decisions: path.join(OUTPUT_ROOT, 'decisions'),
  handoffCandidates: path.join(OUTPUT_ROOT, 'handoff_candidates'),
  blockers: path.join(OUTPUT_ROOT, 'blockers'),
  secondarySourceNotes: path.join(OUTPUT_ROOT, 'secondary_source_notes'),
  scorecards: path.join(OUTPUT_ROOT, 'scorecards'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  firstAttemptReviewerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_attempt_reviewer', 'grinders_keep_first_attempt_review_manifest_2026-06-01.json'),
  firstItemPacketManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet', 'grinders_keep_first_item_packet_manifest_2026-06-01.json'),
  sessionLoggerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_session_logger', 'grinders_keep_session_logger_manifest_2026-06-01.json'),
  evidencePackImportManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_pack_importer', 'grinders_keep_evidence_pack_import_manifest_2026-06-01.json'),
  
  // Folders to search for logs
  sessionLogsDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection_sessions', 'attempt_logs'),
  fileReferencesDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection_sessions', 'file_references'),
  manualModelResponsesDir: path.join(REPO_ROOT, 'inputs', 'grinders_keep', 'evidence_collection', 'manual_model_responses'),

  frontpage: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'grinders_keep_frontpage_2026-06-01.md'),
  systemStatus: path.join(REPO_ROOT, 'SYSTEM_STATUS.md'),
  projects: path.join(REPO_ROOT, 'PROJECTS.md'),
  nextActions: path.join(REPO_ROOT, 'NEXT_ACTIONS.md'),
  commands: path.join(REPO_ROOT, 'config', 'commands.ts'),
  readme: path.join(REPO_ROOT, 'README.md'),
  schedulerStatus: path.join(REPO_ROOT, 'SCHEDULER_STATUS.md'),
};
