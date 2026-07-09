export const GOOGLE_ULTRA_SCANNER_ONLY = true;
export const ALLOW_EXTERNAL_API_CALLS = false;
export const ALLOW_AUTOMATED_GOOGLE_EXECUTION = false;
export const REQUIRE_MANUAL_REVIEW = true;

export const GOOGLE_ULTRA_WORKFLOW_TYPES = [
  'Gemini',
  'NotebookLM',
  'Flow',
  'Whisk',
  'Veo',
  'Antigravity',
  'Drive',
  'Docs',
  'Sheets',
  'Gmail',
  'YouTube',
  'Google Vids'
];

export const SCANNER_STATUS_LABELS = [
  'staged',
  'needs_review',
  'approved_for_integration',
  'rejected'
];

// Paths
export const GOOGLE_ULTRA_SCAN_DIR = 'outputs/grinders_keep_google_ultra/';
export const GOOGLE_ULTRA_SCAN_REPORTS_DIR = 'outputs/grinders_keep_google_ultra/reports/';
export const GOOGLE_ULTRA_SCAN_LOG_DIR = 'outputs/grinders_keep_google_ultra/logs/';
export const GOOGLE_ULTRA_SCAN_TEMPLATES_DIR = 'templates/grinders_keep_google_ultra/';
