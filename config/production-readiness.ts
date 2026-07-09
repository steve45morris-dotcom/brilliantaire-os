export const MINIMUM_READINESS_THRESHOLD = 85;

export const READINESS_CRITERIA_WEIGHTS = {
  buildHealth: 30,
  lintHealth: 20,
  testCoverage: 20,
  governanceCompliance: 15,
  documentationCoverage: 15
};

export const READINESS_OUTPUT_DIR = 'outputs/production_readiness/';
export const READINESS_LOG_DIR = 'outputs/production_readiness/logs/';
