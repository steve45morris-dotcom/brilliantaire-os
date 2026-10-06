import * as path from 'path';

const rootDir = process.cwd();

// File Paths
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOCS_PATH = path.join(rootDir, 'COMMANDS.md');
export const README_PATH = path.join(rootDir, 'README.md');

// Directories
export const DASHBOARD_DIST_DIR = path.join(rootDir, 'dashboard/dist');
export const DASHBOARD_TELEMETRY_DIR = path.join(rootDir, 'outputs/narrator/voice_loop_dashboard');
export const PHASE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator');
export const RUNBOOK_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook');
export const CERTIFICATION_LEDGER_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_certification_ledger');
export const RECERTIFICATION_SCHEDULER_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_recertification_scheduler');
export const FREEZE_SNAPSHOT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot');
export const HEALTH_MONITOR_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health');
export const MAINTENANCE_SCHEDULER_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler');

// Final Index Output Paths
export const FINAL_INDEX_OUTPUT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_final_system_index');
export const FINAL_INDEX_INDEXES_DIR = path.join(FINAL_INDEX_OUTPUT_DIR, 'indexes');
export const FINAL_INDEX_LOGS_DIR = path.join(FINAL_INDEX_OUTPUT_DIR, 'logs');
export const FINAL_INDEX_REPORTS_DIR = path.join(FINAL_INDEX_OUTPUT_DIR, 'reports');
export const FINAL_INDEX_SNAPSHOTS_DIR = path.join(FINAL_INDEX_OUTPUT_DIR, 'snapshots');

// Expected Scope
export const EXPECTED_PHASE_RANGE = 'N5A through N5X';

// Index Flags
export const INCLUDE_COMMAND_INDEX = true;
export const INCLUDE_REPORT_INDEX = true;
export const INCLUDE_DASHBOARD_INDEX = true;
export const INCLUDE_SAFETY_INDEX = true;
export const INCLUDE_CERTIFICATION_INDEX = true;
export const INCLUDE_ROADMAP = true;

// Hardcoded Safe Operational Boundaries (Strict Rules)
export const READONLY_MODE = true;
export const AUTO_EXECUTE = false;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_PLAYBACK = false;
