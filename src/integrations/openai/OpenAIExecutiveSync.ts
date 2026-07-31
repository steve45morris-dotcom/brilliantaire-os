import { globalGoalManager } from '../../executive/GoalManager.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';

export class OpenAIExecutiveSync {
  public static syncToExecutive(requestId: string, goalTitle: string, status: 'completed' | 'in_progress'): void {
    const goals = globalGoalManager.getGoals();
    const existing = goals.find(g => g.title === goalTitle && g.project === 'OpenAI');
    
    if (existing) {
      globalGoalManager.updateGoalStatus(existing.id, status === 'completed' ? 'completed' : 'in_progress');
    } else {
      const item = globalGoalManager.addGoal(goalTitle, 'OpenAI');
      if (status === 'completed') {
        globalGoalManager.updateGoalStatus(item.id, 'completed');
      }
    }

    globalEventBus.publish('OpenAIExecutiveSynced', { requestId, goalTitle, status });
  }
}

export const globalOpenAIExecutiveSync = new OpenAIExecutiveSync();
