import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

// Safety & Scope Rules
export const MODULE_NAME = 'Grinders Keep First Evidence Manual Completion Loop';
export const LOCAL_FIRST_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_GOOGLE_TOOL_EXECUTION = false;
export const ALLOW_PUBLISHING = false;
export const ALLOW_UPLOADING = false;
export const ALLOW_EMAILS = false;
export const ALLOW_DELETION = false;

// Safety overrides strictly locked to false
export const EVIDENCE_COLLECTION_PERFORMED = false;
export const EXTERNAL_MODEL_CALL_ALLOWED = false;
export const COMMAND_EXECUTION_ALLOWED = false;
export const EVIDENCE_VALIDATION_ALLOWED = false;
export const FILE_MOVE_ALLOWED = false;
export const FILE_COPY_ALLOWED = false;
export const AUTO_IMPORT_ALLOWED = false;

// Output Directories Setup
export const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_manual_completion_loop');
export const outputFolders = {
  root: OUTPUT_ROOT,
  checklist: path.join(OUTPUT_ROOT, 'checklist'),
  copyPastePrompt: path.join(OUTPUT_ROOT, 'copy_paste_prompt'),
  saveInstruction: path.join(OUTPUT_ROOT, 'save_instruction'),
  sessionLog: path.join(OUTPUT_ROOT, 'session_log'),
  rerunCommands: path.join(OUTPUT_ROOT, 'rerun_commands'),
  safety: path.join(OUTPUT_ROOT, 'safety'),
  logs: path.join(OUTPUT_ROOT, 'logs'),
};

// Templates path
export const TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');

// Primary telemetry source files
export const referenceSources = {
  firstImporterGateManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_importer_gate', 'grinders_keep_first_importer_gate_manifest_2026-06-01.json'),
  firstAttemptReviewerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'first_evidence_attempt_reviewer', 'grinders_keep_first_attempt_review_manifest_2026-06-01.json'),
  firstItemPacketManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet', 'grinders_keep_first_item_packet_manifest_2026-06-01.json'),
  sessionLoggerManifest: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_collection_session_logger', 'grinders_keep_session_logger_manifest_2026-06-01.json'),
  
  // Folders and files
  firstItemPromptFile: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet', 'manual_prompt', 'grinders_keep_first_item_manual_prompt_2026-06-01.md'),
  firstItemSavePathFile: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet', 'save_path', 'grinders_keep_first_item_save_path_2026-06-01.md'),
  firstItemSessionLogFile: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet', 'session_log', 'grinders_keep_first_item_session_log_template_2026-06-01.md'),
  firstItemRerunFile: path.join(REPO_ROOT, 'outputs', 'grinders_keep', 'evidence_first_item_collection_packet', 'rerun', 'grinders_keep_first_item_rerun_sequence_2026-06-01.md'),
  
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
