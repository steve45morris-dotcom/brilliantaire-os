import { globalIntelligenceRegistry } from './IntelligenceRegistry.js';
import { globalGoalManager } from '../executive/GoalManager.js';

export class ExecutiveFeed {
  public syncToExecutive(): void {
    const recommendations = globalIntelligenceRegistry.getRecommendations();
    const criticalRecs = recommendations.filter(r => r.priority === 'critical');
    const existingGoals = globalGoalManager.getGoals();

    criticalRecs.forEach(r => {
      const exists = existingGoals.some(g => g.title === r.title);
      if (!exists) {
        globalGoalManager.addGoal(r.title, 'Intelligence Recommendation');
      }
    });
  }
}

export const globalExecutiveFeed = new ExecutiveFeed();
export default globalExecutiveFeed;
