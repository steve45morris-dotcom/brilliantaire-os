export interface StrategicPlan {
  period: 'weekly' | 'monthly';
  goals: string[];
  recommendedWorkflows: string[];
  targetRevenue: number;
}

export class StrategyPlanner {
  public generateStrategy(period: 'weekly' | 'monthly'): StrategicPlan {
    const goals = period === 'weekly' 
      ? ['Increase TreeGroove Spotify streams', 'Run ProfBetGeng betting automation campaign'] 
      : ['Launch distributed AI OS', 'Complete monetization audits across 4 brand branches'];

    const recommendedWorkflows = period === 'weekly' 
      ? ['wf-marketing', 'wf-revenue'] 
      : ['wf-release', 'wf-research'];

    return {
      period,
      goals,
      recommendedWorkflows,
      targetRevenue: period === 'weekly' ? 1500 : 8000
    };
  }
}

export const globalStrategyPlanner = new StrategyPlanner();
