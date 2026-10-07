import * as path from 'path';

const rootDir = process.cwd();

// Configured Core File Paths
export const SYSTEM_STATUS_PATH = path.join(rootDir, 'SYSTEM_STATUS.md');
export const PROJECTS_PATH = path.join(rootDir, 'PROJECTS.md');
export const NEXT_ACTIONS_PATH = path.join(rootDir, 'NEXT_ACTIONS.md');
export const COMMANDS_DOCS_PATH = path.join(rootDir, 'COMMANDS.md');
export const README_PATH = path.join(rootDir, 'README.md');

// Evidence File & Folder Paths
export const FINAL_SYSTEM_INDEX_PATH = path.join(rootDir, 'VOICE_OPS_FINAL_SYSTEM_INDEX.md');
export const RELEASE_CLOSURE_REPORT_PATH = path.join(rootDir, 'outputs/narrator/voice_ops_release_closure/reports');
export const FREEZE_SNAPSHOT_REPORT_PATH = path.join(rootDir, 'outputs/narrator/voice_ops_freeze_snapshot/reports');
export const POST_FREEZE_HEALTH_REPORT_PATH = path.join(rootDir, 'outputs/narrator/voice_ops_post_freeze_health/reports');
export const OPERATOR_RUNBOOK_PATH = path.join(rootDir, 'VOICE_OPS_OPERATOR_RUNBOOK.md');
export const CERTIFICATION_LEDGER_PATH = path.join(rootDir, 'VOICE_OPS_OPERATOR_CERTIFICATION_LEDGER.md');
export const RECERTIFICATION_REPORT_PATH = path.join(rootDir, 'VOICE_OPS_RECERTIFICATION_DRILL_ROTATION.md');
export const DASHBOARD_TELEMETRY_PATH = path.join(rootDir, 'outputs/narrator/voice_loop_dashboard');

// Final Acceptance Output Directories
export const FINAL_ACCEPTANCE_OUTPUT_DIR = path.join(rootDir, 'outputs/narrator/voice_ops_final_acceptance');
export const FINAL_ACCEPTANCE_PACKETS_DIR = path.join(FINAL_ACCEPTANCE_OUTPUT_DIR, 'packets');
export const FINAL_ACCEPTANCE_REPORTS_DIR = path.join(FINAL_ACCEPTANCE_OUTPUT_DIR, 'reports');
export const FINAL_ACCEPTANCE_LOGS_DIR = path.join(FINAL_ACCEPTANCE_OUTPUT_DIR, 'logs');
export const FINAL_ACCEPTANCE_EVIDENCE_DIR = path.join(FINAL_ACCEPTANCE_OUTPUT_DIR, 'evidence_index');

// Accepted Ranges and Operator Certification Requirements
export const ACCEPTED_PHASE_RANGE = 'N5A through N5Y';
export const REQUIRED_OPERATOR_CERTIFICATION_LEVEL = 'Safety Certified';
export const REQUIRED_SCENARIO_COUNT = 10;
export const REQUIRED_EMERGENCY_DRILL = 'passed';

// Proof Checklist Requirements
export const REQUIRE_EXACT_NAME_ROUTING_PROOF = true;
export const REQUIRE_FUZZY_BLOCK_PROOF = true;
export const REQUIRE_BUILD_PROOF = true;
export const REQUIRE_AUDIT_PROOF = true;
export const REQUIRE_DASHBOARD_BUILD_PROOF = true;

// Hardcoded Local & Readonly Safe Operational Boundaries (Strict Rules)
export const READONLY_MODE = true;
export const AUTO_EXECUTE = false;
export const AUTO_REPAIR = false;
export const AUTO_RESTORE = false;
export const AUTO_DELETE = false;
export const AUTO_SEND = false;
export const AUTO_UPLOAD = false;
export const AUTO_PUBLISH = false;
export const AUTO_PLAYBACK = false;
