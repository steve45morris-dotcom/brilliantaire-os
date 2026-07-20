import { globalPriorityEngine } from './PriorityEngine.js';
import { globalDecisionEngine } from './DecisionEngine.js';
import { globalRiskAnalyzer } from './RiskAnalyzer.js';
import { globalOpportunityScanner } from './OpportunityScanner.js';
import { globalGoalManager } from './GoalManager.js';
import { globalRoadmapPlanner } from './RoadmapPlanner.js';
import { globalExecutiveReports } from './ExecutiveReports.js';

export class ExecutiveCoordinator {
  public getSystemAssessment() {
    const goals = globalGoalManager.getGoals();
    const milestones = globalRoadmapPlanner.getMilestones();
    const brief = globalExecutiveReports.generateBrief();
    
    // Sample priorities
    const prioritized = globalPriorityEngine.rankItems([
      { id: '1', name: 'TreeGroove Campaign', revenuePotential: 8, daysStale: 2, failureRate: 0.1 },
      { id: '2', name: 'Betting Automation Core', revenuePotential: 9, daysStale: 4, failureRate: 0.35 }
    ]);

    // Sample risks
    const risks = globalRiskAnalyzer.analyzeSystemRisks(
      [{ name: 'Joy Beauty Store Web app', isBlocked: true }],
      [{ name: 'wf-publishing', failureRate: 0.4 }],
      false
    );

    // Sample opportunities
    const opportunities = globalOpportunityScanner.scanOpportunities(['Automated agent rollout guidelines']);

    return {
      prioritized,
      goals,
      milestones,
      risks,
      opportunities,
      brief
    };
  }
}

export const globalExecutive = new ExecutiveCoordinator();
