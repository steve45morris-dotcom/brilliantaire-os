export interface GoalItem {
  id: string;
  title: string;
  project: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export class GoalManager {
  private goals: GoalItem[] = [
    { id: 'goal-1', title: 'Implement OSK Core Runtime', project: 'The One System', status: 'completed' },
    { id: 'goal-2', title: 'Establish Live Data Adapters', project: 'The One System', status: 'in_progress' }
  ];

  public getGoals(): GoalItem[] {
    return [...this.goals];
  }

  public addGoal(title: string, project: string): GoalItem {
    const item: GoalItem = {
      id: `goal-${Date.now()}`,
      title,
      project,
      status: 'pending'
    };
    this.goals.push(item);
    return item;
  }

  public updateGoalStatus(id: string, status: GoalItem['status']): void {
    const goal = this.goals.find(g => g.id === id);
    if (goal) goal.status = status;
  }
}

export const globalGoalManager = new GoalManager();
