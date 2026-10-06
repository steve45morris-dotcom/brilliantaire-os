import * as path from 'path';

const rootDir = process.cwd();

// Core Directories
export const RUNBOOK_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook');
export const MAINTENANCE_SCHEDULER_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_maintenance_scheduler');
export const POST_FREEZE_HEALTH_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health');
export const FREEZE_SNAPSHOT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot');
export const DELIVERY_HANDOFF_DIR = path.join(rootDir, 'outputs/narrator/briefing_delivery_package');

// Training Output Directories
export const TRAINING_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_training_simulation');
export const SCENARIO_DIR = path.join(TRAINING_ROOT, 'scenarios');
export const ATTEMPTS_DIR = path.join(TRAINING_ROOT, 'attempts');
export const REPORTS_DIR = path.join(TRAINING_ROOT, 'reports');
export const LOGS_DIR = path.join(TRAINING_ROOT, 'logs');
export const MOCK_DATA_DIR = path.join(TRAINING_ROOT, 'mock_data');

// Safety Policy & Simulation Gating
export const SIMULATION_MODE = true;
export const PRODUCTION_MUTATION_ALLOWED = false;
export const LIVE_COMMAND_EXECUTION_ALLOWED = false;
export const MOCK_DATA_ONLY = true;

export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_PLAYBACK = false;
export const MANUAL_SCORING_REQUIRED = true;
