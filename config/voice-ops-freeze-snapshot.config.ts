import * as path from 'path';

const rootDir = process.cwd();

// Input Sources
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOC_PATH = path.join(rootDir, 'COMMANDS.md');

// Telemetry & Build Inputs
export const DASHBOARD_DIST_DIR = path.join(rootDir, 'dashboard/dist');
export const DASHBOARD_TELEMETRY_DIR = path.join(rootDir, 'dashboard/public');
export const PHASE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator');
export const RELEASE_CLOSURE_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/reports');
export const DELIVERY_PACKAGE_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/packages');
export const HANDOFF_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/approved');
export const ARCHIVE_RETENTION_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention');

// Target Freeze Snaphots Directories (Phase N5R)
export const FREEZE_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot');
export const FREEZE_TAGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/tags');
export const FREEZE_MANIFESTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/manifests');
export const RECOVERY_CHECKLIST_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/recovery_checklists');
export const FREEZE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/logs');
export const FREEZE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/reports');

// Options
export const RECOMMENDED_FREEZE_TAG_NAME = 'voice-ops-n5q-stable';
export const INCLUDE_DASHBOARD_SNAPSHOT = true;
export const INCLUDE_REPORT_INDEX = true;
export const INCLUDE_COMMAND_REGISTRY_CHECKSUM = true;
export const INCLUDE_PACKAGE_CHECKSUMS = true;
export const INCLUDE_RECOVERY_CHECKLIST = true;

// Hardcoded Local & Readonly Safety Settings
export const READONLY_MODE = true;
export const AUTO_EXECUTE = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_DELETE = false;
