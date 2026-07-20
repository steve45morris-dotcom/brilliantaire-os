export interface RiskAlert {
  source: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export class RiskAnalyzer {
  public analyzeSystemRisks(
    projects: Array<{ name: string; isBlocked: boolean }>,
    workflows: Array<{ name: string; failureRate: number }>,
    revenueDrop: boolean
  ): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    // Blocked project check
    projects.forEach(p => {
      if (p.isBlocked) {
        alerts.push({
          source: `Project: ${p.name}`,
          severity: 'high',
          message: 'Project pipeline has unmet dependencies and is blocked.'
        });
      }
    });

    // Workflow failure rate check
    workflows.forEach(w => {
      if (w.failureRate > 0.3) {
        alerts.push({
          source: `Workflow: ${w.name}`,
          severity: 'medium',
          message: `Workflow failure rate is currently ${Math.round(w.failureRate * 100)}%. Requires review.`
        });
      }
    });

    // Revenue drop check
    if (revenueDrop) {
      alerts.push({
        source: 'Revenue Streams',
        severity: 'high',
        message: 'Recent revenue streams show a negative weekly trajectory.'
      });
    }

    return alerts;
  }
}

export const globalRiskAnalyzer = new RiskAnalyzer();
