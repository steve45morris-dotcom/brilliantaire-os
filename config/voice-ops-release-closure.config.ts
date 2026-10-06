import * as path from 'path';

const rootDir = process.cwd();

// Input Core System Files
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOC_PATH = path.join(rootDir, 'COMMANDS.md');

// Input Subsystem Directories
export const DASHBOARD_OUT_DIR = path.join(rootDir, 'dashboard/public');
export const VOICE_OPS_REPORT_DIR = path.join(rootDir, 'outputs/narrator');
export const BRIEFING_PACKAGE_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_packages/packages');
export const MANUAL_HANDOFF_DIR = path.join(rootDir, 'outputs/narrator/manual_delivery_handoff/approved');
export const ARCHIVE_RETENTION_DIR = path.join(rootDir, 'outputs/narrator/delivery_archive_retention');

// Release Closure Target Directories (Phase N5Q)
export const CLOSURE_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure');
export const CLOSURE_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/reports');
export const CLOSURE_INDEX_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/index');
export const CLOSURE_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/logs');
export const CLOSURE_SNAPSHOTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/snapshots');

// Rollup Options
export const INCLUDE_DASHBOARD_SNAPSHOT = true;
export const INCLUDE_PHASE_ARTIFACT_INDEX = true;
export const INCLUDE_SAFETY_CHECKLIST = true;
export const INCLUDE_COMMAND_REGISTRY_SUMMARY = true;
export const INCLUDE_NEXT_ROADMAP = true;

// Hardcoded Safety Policies (Strictly Read-only / Local)
export const READONLY_MODE = true;
export const AUTO_EXECUTE = false;
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_DELETE = false;
