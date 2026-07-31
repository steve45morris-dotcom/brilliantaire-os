export interface ExecutiveConfig {
  riskThreshold: number; // e.g. 0.75
  priorityWeights: {
    revenue: number;
    completion: number;
    health: number;
  };
  enableAutoStrategy: boolean;
}

export const globalExecutiveConfig: ExecutiveConfig = {
  riskThreshold: 0.75,
  priorityWeights: {
    revenue: 0.4,
    completion: 0.35,
    health: 0.25
  },
  enableAutoStrategy: true
};
