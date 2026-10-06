import * as path from 'path';

const rootDir = process.cwd();

// Input Sources / Subsystems
export const HEALTH_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/reports');
export const FREEZE_SNAPSHOT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot');
export const RELEASE_CLOSURE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/reports');
export const ARCHIVE_RETENTION_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention');

// Dashboard Directories
export const DASHBOARD_DIST_DIR = path.join(rootDir, 'dashboard/dist');
export const DASHBOARD_TELEMETRY_DIR = path.join(rootDir, 'dashboard/public');

// Maintenance Mode Scheduler Directories (Phase N5T Output)
export const MAINTENANCE_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler');
export const MAINTENANCE_QUEUE_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/queue');
export const MAINTENANCE_APPROVED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/approved');
export const MAINTENANCE_REJECTED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/rejected');
export const MAINTENANCE_COMPLETED_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/completed');
export const MAINTENANCE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/logs');
export const MAINTENANCE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler/reports');

// System Tracking Files (for status checks)
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOC_PATH = path.join(rootDir, 'COMMANDS.md');
export const PACKAGE_JSON_PATH = path.join(rootDir, 'package.json');
export const TASKFILE_PATH = path.join(rootDir, 'Taskfile.yml');
export const COMMANDS_CONFIG_PATH = path.join(rootDir, 'config/commands.ts');

// Scheduler Settings
export const DEFAULT_CADENCE = 'weekly';
export const DEFAULT_MAINTENANCE_LABEL = 'voice-ops-maintenance';
export const MAX_QUEUED_JOBS = 50;

// Strict Safety Policy (Explicitly manual-first, no auto-reconfiguration, no auto-restoration)
export const AUTO_RUN_JOBS = false;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const MANUAL_APPROVAL_REQUIRED = true;
export const DUPLICATE_MAINTENANCE_JOB_PROTECTION = true;
export const READONLY_DASHBOARD_MODE = true;
