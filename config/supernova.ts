export type OperatingMode = 'development' | 'certification' | 'production' | 'recovery' | 'learning';

export const ACTIVE_OPERATING_MODE: OperatingMode = 'certification';

export const SUPERNOVA_OUTPUT_DIR = 'outputs/supernova/reports/';
export const SUPERNOVA_LOG_DIR = 'outputs/supernova/logs/';

export const STRATEGIC_WEIGHTS = {
  value: 0.4,
  risk: 0.3,
  effort: 0.3
};

export const CONFIDENCE_BASE = 92;
