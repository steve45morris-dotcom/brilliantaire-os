import * as path from 'path';

const rootDir = process.cwd();

// Core Monitor Inputs (Phase N5R Outputs)
export const FREEZE_MANIFESTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/manifests');
export const FREEZE_TAGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/tags');
export const RECOVERY_CHECKLIST_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/recovery_checklists');
export const RELEASE_CLOSURE_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/reports');

// System Tracking Files
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOC_PATH = path.join(rootDir, 'COMMANDS.md');
export const PACKAGE_JSON_PATH = path.join(rootDir, 'package.json');
export const TASKFILE_PATH = path.join(rootDir, 'Taskfile.yml');
export const COMMANDS_CONFIG_PATH = path.join(rootDir, 'config/commands.ts');

// Dashboard Directories
export const DASHBOARD_DIST_DIR = path.join(rootDir, 'dashboard/dist');
export const DASHBOARD_TELEMETRY_DIR = path.join(rootDir, 'dashboard/public');

// Health Monitor Outputs
export const HEALTH_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health');
export const HEALTH_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/reports');
export const HEALTH_LOGS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/logs');
export const HEALTH_SNAPSHOTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/snapshots');
export const HEALTH_DRIFT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/drift');

// Configured Expectations
export const EXPECTED_FREEZE_TAG = 'voice-ops-n5q-stable';
export const EXPECTED_PHASE_RANGE = 'N5A - N5R';

// Verification Include Options
export const INCLUDE_CHECKSUM_VERIFICATION = true;
export const INCLUDE_COMMAND_REGISTRY_VERIFICATION = true;
export const INCLUDE_DASHBOARD_VERIFICATION = true;
export const INCLUDE_SAFETY_POSTURE_VERIFICATION = true;
export const INCLUDE_BUILD_DIAGNOSTICS = true;

// Hardcoded Safety & Readonly Settings (Strict post-freeze security posture)
export const READONLY_MODE = true;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_EXECUTE = false;
export const AUTO_DELETE = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
