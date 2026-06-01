export const APPEND_GATE_ONLY = true;
export const ALLOW_PROJECTS_MD_OVERWRITE = false;
export const ALLOW_APPEND_ALL_BY_DEFAULT = false;
export const REQUIRE_CONFIRM_FLAG = true;
export const REQUIRE_BACKUP_BEFORE_APPEND = true;
export const REQUIRE_STAGED_ENTRIES = true;
export const REQUIRE_DUPLICATE_CHECK = true;

export const PROJECTS_MD_PATH = 'PROJECTS.md';
export const STAGED_ENTRIES_DIR = 'outputs/project_registry/staged_entries/';
export const APPEND_REPORT_DIR = 'outputs/project_registry/append_gate/reports/';
export const BACKUP_DIR = 'outputs/project_registry/append_gate/backups/';
export const LOG_DIR = 'outputs/project_registry/append_gate/logs/';

export const ALLOWED_APPROVAL_MODES = [
  'preview',
  'append-approved',
  'status'
] as const;
