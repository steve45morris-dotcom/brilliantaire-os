import * as path from 'path';

const rootDir = process.cwd();

// Input / System Files
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOC_PATH = path.join(rootDir, 'COMMANDS.md');

// Telemetry & Reports Directories
export const HEALTH_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/reports');
export const FREEZE_SNAPSHOT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot');
export const RELEASE_CLOSURE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/reports');
export const MAINTENANCE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/reports');

// Dashboard Settings
export const DASHBOARD_DIST_DIR = path.join(rootDir, 'dashboard/dist');
export const DASHBOARD_PREVIEW_SCRIPT_PATH = path.join(rootDir, 'scripts/open_preview.sh');

// Runbook Target Directories (Phase N5U Output)
export const RUNBOOK_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook');
export const RUNBOOK_RUNBOOKS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook/runbooks');
export const RUNBOOK_CHECKLISTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook/checklists');
export const RUNBOOK_INDEX_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook/index');
export const RUNBOOK_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook/logs');
export const RUNBOOK_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook/reports');

// Ingestion Parameters
export const INCLUDE_COMMAND_INDEX = true;
export const INCLUDE_SAFETY_CHECKLIST = true;
export const INCLUDE_TROUBLESHOOTING_MATRIX = true;
export const INCLUDE_EMERGENCY_STOP_GUIDE = true;

// Hardcoded Local & Readonly Safety Settings (Non-negotiable post-freeze policy)
export const READONLY_MODE = true;
export const AUTO_EXECUTE = false;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
