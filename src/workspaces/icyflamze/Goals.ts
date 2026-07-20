import { globalGoalManager, GoalItem } from '../../executive/GoalManager.js';
import { globalEventBus } from '../../kernel/events/EventBus.js';
import { globalNodeRegistry } from '../../knowledge/NodeRegistry.js';
import { globalEdgeRegistry } from '../../knowledge/EdgeRegistry.js';

export interface LinkedGoal extends GoalItem {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  linkedEntityId?: string; // songId, contentId, etc.
  priorityLevel: 'high' | 'medium' | 'low';
}

export class GoalConnector {
  private linkedGoals: LinkedGoal[] = [
    {
      id: 'icy-g1',
      title: 'Draft creative script for Episode 1 trailer',
      project: 'Icyflamze',
      status: 'completed',
      timeframe: 'weekly',
      linkedEntityId: 'content-1',
      priorityLevel: 'high'
    },
    {
      id: 'icy-g2',
      title: 'Plan marketing asset schedule',
      project: 'Icyflamze',
      status: 'in_progress',
      timeframe: 'weekly',
      linkedEntityId: 'rel-street-scholar',
      priorityLevel: 'high'
    },
    {
      id: 'icy-g3',
      title: 'Record vocal bars for Blue Gold Flame',
      project: 'Icyflamze',
      status: 'completed',
      timeframe: 'daily',
      linkedEntityId: 'song-blue-gold-flame',
      priorityLevel: 'high'
    },
    {
      id: 'icy-g4',
      title: 'Reach $5,000 streaming revenue threshold',
      project: 'Icyflamze',
      status: 'in_progress',
      timeframe: 'monthly',
      linkedEntityId: 'rev-income-1',
      priorityLevel: 'medium'
    }
  ];

  constructor() {
    // Seed goals in globalGoalManager if not present
    this.linkedGoals.forEach(g => {
      const exists = globalGoalManager.getGoals().some(ex => ex.id === g.id);
      if (!exists) {
        // Register to global list
        globalGoalManager.addGoal(g.title, g.project);
      }
    });
  }

  public getGoals(): LinkedGoal[] {
    return [...this.linkedGoals];
  }

  public addLinkedGoal(goalData: Omit<LinkedGoal, 'id'>): LinkedGoal {
    const goal: LinkedGoal = {
      id: `icy-goal-${Date.now()}`,
      ...goalData
    };
    this.linkedGoals.push(goal);

    // Sync with executive GoalManager
    const item = globalGoalManager.addGoal(goal.title, goal.project);
    goal.id = item.id; // Keep IDs aligned

    // Register node in Knowledge Graph
    globalNodeRegistry.registerNode(goal.id, 'Goal', {
      title: goal.title,
      timeframe: goal.timeframe,
      priorityLevel: goal.priorityLevel,
      status: goal.status
    });
    globalEdgeRegistry.registerEdge(goal.id, 'system-core', 'RELATED_TO');
    if (goal.linkedEntityId) {
      globalEdgeRegistry.registerEdge(goal.id, goal.linkedEntityId, 'REFERENCES');
    }

    // Notify EventBus
    globalEventBus.publish('IcyflamzeGoalAdded', { goalId: goal.id, title: goal.title });

    return goal;
  }

  public updateGoalStatus(id: string, status: LinkedGoal['status']): void {
    const goal = this.linkedGoals.find(g => g.id === id);
    if (goal) {
      goal.status = status;
      globalGoalManager.updateGoalStatus(id, status);

      // Notify EventBus
      globalEventBus.publish('IcyflamzeGoalUpdated', { goalId: id, status });

      // Update Knowledge Graph
      globalNodeRegistry.registerNode(id, 'Goal', {
        title: goal.title,
        timeframe: goal.timeframe,
        priorityLevel: goal.priorityLevel,
        status: goal.status
      });
    }
  }
}

export const globalGoalConnector = new GoalConnector();
