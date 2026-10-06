import * as path from 'path';

const rootDir = process.cwd();

// Input directories (Phase N5V outputs)
export const TRAINING_SCENARIOS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_training_simulation/scenarios');
export const TRAINING_ATTEMPTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_training_simulation/attempts');
export const TRAINING_REPORTS_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_training_simulation/reports');
export const RUNBOOK_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_operator_runbook');

// Output directories
export const LEDGER_ROOT = path.join(rootDir, 'outputs/narrator/voice_ops_certification_ledger');
export const LEDGER_DIR = path.join(LEDGER_ROOT, 'ledger');
export const LEDGER_RECORDS_DIR = path.join(LEDGER_ROOT, 'records');
export const LEDGER_REPORTS_DIR = path.join(LEDGER_ROOT, 'reports');
export const LEDGER_LOGS_DIR = path.join(LEDGER_ROOT, 'logs');
export const LEDGER_EXPORTS_DIR = path.join(LEDGER_ROOT, 'exports');

// Certification thresholds & validations
export const MINIMUM_PASSING_SCORE = 80;
export const REQUIRED_SCENARIO_COUNT = 10;
export const REQUIRED_EMERGENCY_SCENARIO = 'emergency_stop_drill';
export const CERTIFICATION_VALIDITY_DAYS = 30;

export const REQUIRE_SIGNER = true;
export const REQUIRE_NOTE = true;
export const SIMULATION_EVIDENCE_REQUIRED = true;

// Hardcoded safe boundaries
export const PRODUCTION_MUTATION_ALLOWED = false;
export const LIVE_COMMAND_EXECUTION_ALLOWED = false;
export const AUTO_CERTIFY = false;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_PLAYBACK = false;
