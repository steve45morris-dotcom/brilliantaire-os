export interface DecisionRecord {
  id: string;
  title: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  timestamp: string;
}

export class DecisionEngine {
  private decisions: DecisionRecord[] = [];

  public analyzeObservation(observation: { type: string; details: string; severity: number }): DecisionRecord {
    const id = `dec-${Date.now()}`;
    const requiresApproval = observation.severity > 0.7;
    const impactLevel = observation.severity > 0.7 ? 'high' : observation.severity > 0.4 ? 'medium' : 'low';

    const decision: DecisionRecord = {
      id,
      title: `Executive Directive: Resolve ${observation.type}`,
      description: observation.details,
      impactLevel,
      requiresApproval,
      timestamp: new Date().toISOString()
    };

    this.decisions.push(decision);
    return decision;
  }

  public getDecisions(): DecisionRecord[] {
    return [...this.decisions];
  }
}

export const globalDecisionEngine = new DecisionEngine();
