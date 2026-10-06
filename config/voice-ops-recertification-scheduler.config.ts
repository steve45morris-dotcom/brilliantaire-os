import * as path from 'path';

const rootDir = process.cwd();

// Input Directories (From Phase N5W and N5V)
export const LEDGER_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_certification_ledger');
export const LEDGER_DIR = path.join(LEDGER_ROOT, 'ledger');
export const LEDGER_RECORDS_DIR = path.join(LEDGER_ROOT, 'records');
export const TRAINING_SCENARIOS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_training_simulation/scenarios');
export const TRAINING_ATTEMPTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_training_simulation/attempts');

// Output Directories
export const RECERT_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_recertification_scheduler');
export const RECERT_QUEUE_DIR = path.join(RECERT_ROOT, 'queue');
export const RECERT_APPROVED_DIR = path.join(RECERT_ROOT, 'approved');
export const RECERT_COMPLETED_DIR = path.join(RECERT_ROOT, 'completed');
export const RECERT_REJECTED_DIR = path.join(RECERT_ROOT, 'rejected');
export const RECERT_ROTATIONS_DIR = path.join(RECERT_ROOT, 'rotations');
export const RECERT_CALENDARS_DIR = path.join(RECERT_ROOT, 'calendars');
export const RECERT_REPORTS_DIR = path.join(RECERT_ROOT, 'reports');
export const RECERT_LOGS_DIR = path.join(RECERT_ROOT, 'logs');

// Thresholds & General Settings
export const CERTIFICATION_VALIDITY_DAYS = 30;
export const RENEWAL_WARNING_DAYS = 7;
export const DEFAULT_DRILL_CADENCE = 'weekly';
export const REQUIRED_RENEWAL_SCENARIO_COUNT = 3;
export const REQUIRED_EMERGENCY_DRILL = 'emergency_stop_drill';

export const ROTATION_CATEGORIES = [
  'dashboard_health',
  'tts_asr_backend',
  'routing_safety',
  'package_handoff',
  'archive_retention',
  'emergency_stop'
];

// Hardcoded Safe Operational Boundaries
export const AUTO_RENEW_CERTIFICATION = false;
export const AUTO_START_SIMULATIONS = false;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_PLAYBACK = false;
export const LIVE_COMMAND_EXECUTION_ALLOWED = false;
export const MANUAL_APPROVAL_REQUIRED = true;
