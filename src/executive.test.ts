import { describe, it, expect } from 'vitest';
import { PriorityEngine } from './executive/PriorityEngine.js';
import { DecisionEngine } from './executive/DecisionEngine.js';
import { RiskAnalyzer } from './executive/RiskAnalyzer.js';

describe('Executive Layer Tests', () => {
  it('should prioritize and rank projects by score correctly', () => {
    const engine = new PriorityEngine();
    const items = [
      { id: '1', name: 'Low Value', revenuePotential: 1, daysStale: 1, failureRate: 0 },
      { id: '2', name: 'High Value', revenuePotential: 9, daysStale: 5, failureRate: 0.5 }
    ];

    const ranked = engine.rankItems(items);
    expect(ranked[0].name).toBe('High Value');
    expect(ranked[0].priority).toBe('P1');
    expect(ranked[1].priority).toBe('P3');
  });

  it('should compile observations into decision records', () => {
    const engine = new DecisionEngine();
    const record = engine.analyzeObservation({
      type: 'Stale workflow runtime',
      details: 'Sync loops timed out twice',
      severity: 0.85
    });

    expect(record.impactLevel).toBe('high');
    expect(record.requiresApproval).toBe(true);
  });

  it('should analyze and identify high severity project risks', () => {
    const analyzer = new RiskAnalyzer();
    const alerts = analyzer.analyzeSystemRisks(
      [{ name: 'Avatar Sync Engine', isBlocked: true }],
      [{ name: 'wf-revenue', failureRate: 0.1 }],
      true
    );

    expect(alerts.length).toBe(2);
    expect(alerts.some(a => a.source === 'Revenue Streams')).toBe(true);
  });
});
