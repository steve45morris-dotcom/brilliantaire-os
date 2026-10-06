import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '..');

export const MODULE_NAME = 'Grinders Keep Evidence Detector';

// Config: expected evidence locations (presence-only checks)
export const EVIDENCE_ROOTS = [
  path.join(REPO_ROOT, "grinders-keep", "sessions"),      // completed session logs
  path.join(REPO_ROOT, "grinders-keep", "evidence"),      // evidence markdown files
];

export const PATTERNS = {
  sessionLog: /^session_\d{4}-\d{2}-\d{2}.*\.log$/,
  evidenceDoc: /^evidence_.*\.md$/,
};

export const OUTPUT_PATHS = {
  snapshotJson: path.join(REPO_ROOT, "telemetry", "grinders_keep_evidence_snapshot.json"),
  completionReportMd: path.join(REPO_ROOT, "stable_grinders_keep_evidence_completion_report.md"),
};
