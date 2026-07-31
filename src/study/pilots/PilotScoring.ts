import { metricPassed } from './PilotMetrics.js';
import type { PilotRecord } from './PilotTypes.js';

export interface PilotScore {
  score: number;
  metMetrics: number;
  totalMetrics: number;
}

export function scorePilot(pilot: PilotRecord): PilotScore {
  const totalMetrics = pilot.successMetrics.length;
  const metMetrics = pilot.successMetrics.filter((target) => {
    const result = pilot.measuredOutcome?.metrics.find((metric) => metric.name === target.name);
    return result ? metricPassed(target, result) : false;
  }).length;

  return {
    score: totalMetrics === 0 ? 0 : Math.round((metMetrics / totalMetrics) * 100),
    metMetrics,
    totalMetrics
  };
}
