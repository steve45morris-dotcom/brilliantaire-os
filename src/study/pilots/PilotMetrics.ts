import type { PilotMetricResult, PilotMetricTarget } from './PilotTypes.js';

export function metricPassed(target: PilotMetricTarget, result: PilotMetricResult): boolean {
  if (target.name !== result.name || target.unit !== result.unit) return false;
  if (target.direction === 'at-least') return result.value >= target.target;
  if (target.direction === 'at-most') return result.value <= target.target;
  return result.value === target.target;
}
